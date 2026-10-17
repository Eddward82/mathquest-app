import { create } from "zustand";
import { firestore, userDoc } from "../lib/firebase";
import { useProgressStore } from "./progressStore";
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────
export const FREE_LIFETIME_LIMIT = 5;
const RC_GOOGLE_KEY = "goog_fEskqSivLsiojXLGnkOyVVPtocp";
const ENTITLEMENT_POLL_DELAY_MS = 2000;
const ENTITLEMENT_POLL_ATTEMPTS = 3;

// Module-level listener reference so it can be removed before re-adding
let customerInfoListener: (info: CustomerInfo) => void = () => {};

function isPremiumFromCustomerInfo(info: CustomerInfo): boolean {
  return info.entitlements.active["premium"] !== undefined;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Only Android has a RevenueCat key; elsewhere every purchase call would throw.
const NOT_AVAILABLE = "Subscriptions aren't available on this device yet.";

export interface PurchaseResult {
  success: boolean;
  /** User-facing message; absent when the user simply cancelled. */
  error?: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type PlanId = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  label: string;
  price: string;
  perMonth: string;
  badge: string | null;
  highlight: boolean;
}

// Fallback prices shown before RevenueCat loads
export const PLANS: Plan[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: "...",
    perMonth: ".../mo",
    badge: null,
    highlight: false,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "...",
    perMonth: ".../mo",
    badge: "Best Value",
    highlight: true,
  },
];

interface SubscriptionState {
  isPremium: boolean;
  premiumExpiresAt: string | null;
  isInitialized: boolean;
  plans: Plan[];

  // Lifetime usage tracking. Each distinct lesson counts once, so reopening a
  // lesson never uses up another free start.
  lessonsStartedTotal: number;
  startedLessonIds: Set<string>;

  // Actions
  initRevenueCat: (userId: string) => Promise<void>;
  loadSubscription: (userId: string) => Promise<void>;
  loadPlans: () => Promise<void>;
  canStartLesson: (lessonId?: string) => boolean;
  recordLessonStarted: (userId: string, lessonId: string) => Promise<void>;
  purchasePlan: (planId: PlanId) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  activatePremium: (userId: string, planId: PlanId) => Promise<PurchaseResult>;
  cancelPremium: (userId: string) => Promise<void>;
  remainingToday: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPremium: false,
  premiumExpiresAt: null,
  isInitialized: false,
  lessonsStartedTotal: 0,
  startedLessonIds: new Set(),
  plans: PLANS,

  initRevenueCat: async (userId) => {
    try {
      // Only Android has a RevenueCat key. Elsewhere stay uninitialized so the
      // purchase actions report "not available" instead of throwing.
      if (Platform.OS !== "android") return;
      await Purchases.configure({ apiKey: RC_GOOGLE_KEY, appUserID: userId || undefined });
      Purchases.setLogLevel(LOG_LEVEL.ERROR);

      // Remove previous listener before adding a new one to prevent duplicates
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
      // Premium status lives only in RevenueCat (server-verified receipts).
      // It is never written to Firestore — user docs are client-writable, so
      // anything stored there could be forged to fake an entitlement.
      customerInfoListener = (info) => {
        const isPremium = isPremiumFromCustomerInfo(info);
        const expiresAt =
          info.entitlements.active["premium"]?.expirationDate ?? null;
        set({ isPremium, premiumExpiresAt: expiresAt });
      };
      Purchases.addCustomerInfoUpdateListener(customerInfoListener);

      set({ isInitialized: true });
      get().loadPlans();
    } catch (e) {
      // Silent — RevenueCat unavailable
    }
  },

  loadPlans: async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) return;

      const monthly = current.monthly;
      const annual = current.annual;

      set({
        plans: [
          {
            id: "monthly",
            label: "Monthly",
            price: monthly?.product.priceString ?? "...",
            perMonth: monthly?.product.priceString ? `${monthly.product.priceString}/mo` : ".../mo",
            badge: null,
            highlight: false,
          },
          {
            id: "yearly",
            label: "Yearly",
            price: annual?.product.priceString ?? "...",
            perMonth: annual?.product.priceString
              ? `${(annual.product.price / 12).toLocaleString(undefined, { style: "currency", currency: annual.product.currencyCode ?? "USD", maximumFractionDigits: 2 })}/mo`
              : ".../mo",
            badge: "Best Value",
            highlight: true,
          },
        ],
      });
    } catch {
      // Offline or RevenueCat unavailable — keep fallback prices
    }
  },

  loadSubscription: async (userId) => {
    if (userId === "guest") return;

    try {
      const snap = await userDoc(userId).get();
      const data = snap.data() ?? {};

      // Entitlement comes only from RevenueCat (works offline via its on-device
      // cache). Firestore fields are client-writable and must never grant premium.
      const { isInitialized } = get();
      if (isInitialized) {
        const info = await Purchases.getCustomerInfo();
        const isPremium = isPremiumFromCustomerInfo(info);
        const expiresAt =
          info.entitlements.active["premium"]?.expirationDate ?? null;
        set({ isPremium, premiumExpiresAt: expiresAt });
      }

      // lessons_started_total is the pre-1.2.4 counter; started_lesson_ids
      // replaced it. Take the larger so upgrading never refunds free lessons.
      const startedLessonIds = new Set<string>(data.started_lesson_ids ?? []);
      const lessonsStartedTotal = Math.max(data.lessons_started_total ?? 0, startedLessonIds.size);
      set({ startedLessonIds, lessonsStartedTotal });
    } catch {
      // Offline — keep existing local state
    }
  },

  canStartLesson: (lessonId) => {
    const { isPremium, lessonsStartedTotal } = get();
    if (isPremium) return true;
    if (lessonId && isAlreadyCounted(lessonId)) return true;
    return lessonsStartedTotal < FREE_LIFETIME_LIMIT;
  },

  recordLessonStarted: async (userId, lessonId) => {
    if (isAlreadyCounted(lessonId)) return;
    const { startedLessonIds, lessonsStartedTotal } = get();
    set({
      startedLessonIds: new Set(startedLessonIds).add(lessonId),
      lessonsStartedTotal: lessonsStartedTotal + 1,
    });
    if (userId === "guest") return;
    try {
      // arrayUnion is idempotent and never overwrites with a stale local
      // count, so it can't trip the "counter may only grow" security rule.
      await userDoc(userId).update({
        started_lesson_ids: firestore.FieldValue.arrayUnion(lessonId),
      });
    } catch {
      // Offline — the write is queued and local state is already updated
    }
  },

  purchasePlan: async (planId) => {
    if (!get().isInitialized) return { success: false, error: NOT_AVAILABLE };
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) return { success: false, error: "No offerings available" };

      const packageToPurchase =
        planId === "monthly"
          ? current.monthly
          : current.annual;

      if (!packageToPurchase) {
        return { success: false, error: "Plan not found" };
      }

      let { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      // Google Play can take a moment to confirm; poll briefly before deciding.
      for (let i = 0; i < ENTITLEMENT_POLL_ATTEMPTS && !isPremiumFromCustomerInfo(customerInfo); i++) {
        await sleep(ENTITLEMENT_POLL_DELAY_MS);
        customerInfo = await Purchases.getCustomerInfo();
      }

      if (!isPremiumFromCustomerInfo(customerInfo)) {
        // Still pending. The customer-info listener unlocks premium as soon
        // as Google Play confirms, so tell the user rather than claim success.
        return {
          success: false,
          error: "Your purchase is processing. Premium will unlock automatically once Google Play confirms it.",
        };
      }

      const expiresAt =
        customerInfo.entitlements.active["premium"]?.expirationDate ?? null;
      set({ isPremium: true, premiumExpiresAt: expiresAt });
      return { success: true };
    } catch (e: any) {
      if (e.userCancelled) return { success: false };
      return { success: false, error: e.message ?? "Purchase failed" };
    }
  },

  restorePurchases: async () => {
    if (!get().isInitialized) return { success: false, error: NOT_AVAILABLE };
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = isPremiumFromCustomerInfo(customerInfo);
      const expiresAt =
        customerInfo.entitlements.active["premium"]?.expirationDate ?? null;
      set({ isPremium, premiumExpiresAt: expiresAt });
      return { success: isPremium };
    } catch (e: any) {
      return { success: false, error: e.message ?? "Restore failed" };
    }
  },

  activatePremium: async (_userId, planId) => get().purchasePlan(planId),

  cancelPremium: async (_userId) => {
    // Display state only — real cancellation happens in Google Play and flows
    // back through RevenueCat's customer-info listener.
    set({ isPremium: false, premiumExpiresAt: null });
  },

  remainingToday: () => {
    const { isPremium, lessonsStartedTotal } = get();
    if (isPremium) return Infinity;
    return Math.max(0, FREE_LIFETIME_LIMIT - lessonsStartedTotal);
  },
}));

// A lesson already started (or finished before per-lesson tracking existed)
// never costs another free start.
function isAlreadyCounted(lessonId: string): boolean {
  return (
    useSubscriptionStore.getState().startedLessonIds.has(lessonId) ||
    useProgressStore.getState().completedLessonIds.has(lessonId)
  );
}
