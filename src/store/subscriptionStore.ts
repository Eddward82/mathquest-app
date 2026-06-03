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

export const PLANS: Plan[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$5.99",
    perMonth: "$5.99/mo",
    badge: null,
    highlight: false,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "$47.99",
    perMonth: "$4.00/mo",
    badge: "Best Value",
    highlight: true,
  },
];

interface SubscriptionState {
  isPremium: boolean;
  premiumExpiresAt: string | null;
  isInitialized: boolean;

  // Lifetime usage tracking
  lessonsStartedTotal: number;

  // Actions
  initRevenueCat: (userId: string) => Promise<void>;
  loadSubscription: (userId: string) => Promise<void>;
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
    } catch (e) {
      // Silent — RevenueCat unavailable
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

      // If entitlement is already active, update immediately
      if (isPremium) {
        set({ isPremium: true, premiumExpiresAt: expiresAt });
        return { success: true };
      }

      // Entitlement not yet active (common in test mode) — poll once after 3s
      await new Promise((resolve) => setTimeout(resolve, ENTITLEMENT_POLL_DELAY_MS));
      const refreshed = await Purchases.getCustomerInfo();
      const isPremiumRefreshed = isPremiumFromCustomerInfo(refreshed);
      const expiresAtRefreshed =
        refreshed.entitlements.active["premium"]?.expirationDate ?? null;
      set({ isPremium: isPremiumRefreshed, premiumExpiresAt: expiresAtRefreshed });

      // Treat purchase as success even if entitlement is delayed
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
