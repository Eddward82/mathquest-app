import { create } from "zustand";
import { userDoc } from "../lib/firebase";
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────
export const FREE_LIFETIME_LIMIT = 5;
const RC_GOOGLE_KEY = "goog_fEskqSivLsiojXLGnkOyVVPtocp";
const ENTITLEMENT_POLL_DELAY_MS = 3000;

// Module-level listener reference so it can be removed before re-adding
let customerInfoListener: (info: CustomerInfo) => void = () => {};

function isPremiumFromCustomerInfo(info: CustomerInfo): boolean {
  return info.entitlements.active["premium"] !== undefined;
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

  // Lifetime usage tracking
  lessonsStartedTotal: number;

  // Actions
  initRevenueCat: (userId: string) => Promise<void>;
  loadSubscription: (userId: string) => Promise<void>;
  loadPlans: () => Promise<void>;
  canStartLesson: () => boolean;
  recordLessonStarted: (userId: string) => Promise<void>;
  purchasePlan: (planId: PlanId) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  activatePremium: (userId: string, planId: PlanId) => Promise<void>;
  cancelPremium: (userId: string) => Promise<void>;
  remainingToday: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPremium: false,
  premiumExpiresAt: null,
  isInitialized: false,
  lessonsStartedTotal: 0,
  plans: PLANS,

  initRevenueCat: async (userId) => {
    try {
      if (Platform.OS === "android") {
        await Purchases.configure({ apiKey: RC_GOOGLE_KEY, appUserID: userId || undefined });
      }
      Purchases.setLogLevel(LOG_LEVEL.ERROR);

      // Remove previous listener before adding a new one to prevent duplicates
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
      customerInfoListener = (info) => {
        const isPremium = isPremiumFromCustomerInfo(info);
        const expiresAt =
          info.entitlements.active["premium"]?.expirationDate ?? null;
        set({ isPremium, premiumExpiresAt: expiresAt });

        if (userId && userId !== "guest") {
          userDoc(userId)
            .update({ is_premium: isPremium, premium_expires_at: expiresAt })
            .catch(() => {});
        }
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
      // Single Firestore fetch reused for both premium fallback and lifetime usage
      const snap = await userDoc(userId).get();
      const data = snap.data() ?? {};

      const { isInitialized } = get();
      if (isInitialized) {
        const info = await Purchases.getCustomerInfo();
        const isPremium = isPremiumFromCustomerInfo(info);
        const expiresAt =
          info.entitlements.active["premium"]?.expirationDate ?? null;
        set({ isPremium, premiumExpiresAt: expiresAt });
      } else {
        // Fallback to Firestore
        const premiumExpiresAt: string | null = data.premium_expires_at ?? null;
        const isPremium =
          data.is_premium === true &&
          (premiumExpiresAt ? new Date(premiumExpiresAt) > new Date() : false);
        set({ isPremium, premiumExpiresAt });
      }

      const lessonsStartedTotal: number = data.lessons_started_total ?? 0;
      set({ lessonsStartedTotal });
    } catch {
      // Offline — keep existing local state
    }
  },

  canStartLesson: () => {
    const { isPremium, lessonsStartedTotal } = get();
    if (isPremium) return true;
    return lessonsStartedTotal < FREE_LIFETIME_LIMIT;
  },

  recordLessonStarted: async (userId) => {
    const { lessonsStartedTotal } = get();
    const newCount = lessonsStartedTotal + 1;
    set({ lessonsStartedTotal: newCount });
    if (userId === "guest") return;
    try {
      await userDoc(userId).update({ lessons_started_total: newCount });
    } catch {
      // Offline — local state is still accurate
    }
  },

  purchasePlan: async (planId) => {
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

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      const isPremium = isPremiumFromCustomerInfo(customerInfo);
      const expiresAt =
        customerInfo.entitlements.active["premium"]?.expirationDate ?? null;

      if (isPremium) {
        set({ isPremium: true, premiumExpiresAt: expiresAt });
      } else {
        // Entitlement not yet active — poll in background, don't block the UI
        setTimeout(async () => {
          try {
            const refreshed = await Purchases.getCustomerInfo();
            const isPremiumRefreshed = isPremiumFromCustomerInfo(refreshed);
            const expiresAtRefreshed =
              refreshed.entitlements.active["premium"]?.expirationDate ?? null;
            set({ isPremium: isPremiumRefreshed, premiumExpiresAt: expiresAtRefreshed });
          } catch {}
        }, ENTITLEMENT_POLL_DELAY_MS);
      }

      // Always return success immediately after purchase — don't wait for poll
      return { success: true };
    } catch (e: any) {
      if (e.userCancelled) return { success: false };
      return { success: false, error: e.message ?? "Purchase failed" };
    }
  },

  restorePurchases: async () => {
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

  activatePremium: async (userId, planId) => {
    const { purchasePlan } = get();
    const result = await purchasePlan(planId);
    if (!result.success && result.error) {
      throw new Error(result.error);
    }
  },

  cancelPremium: async (userId) => {
    set({ isPremium: false, premiumExpiresAt: null });
    if (userId === "guest") return;
    try {
      await userDoc(userId).update({
        is_premium: false,
        premium_expires_at: null,
      });
    } catch {}
  },

  remainingToday: () => {
    const { isPremium, lessonsStartedTotal } = get();
    if (isPremium) return Infinity;
    return Math.max(0, FREE_LIFETIME_LIMIT - lessonsStartedTotal);
  },
}));
