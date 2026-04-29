import { create } from "zustand";
import { userDoc } from "../lib/firebase";
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────
export const FREE_DAILY_LIMIT = 5;
const RC_GOOGLE_KEY = "goog_fEskqSivLsiojXLGnkOyVVPtocp";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

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

  // Daily usage tracking
  lessonsStartedToday: number;
  usageDate: string;

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
  lessonsStartedToday: 0,
  usageDate: todayString(),

  initRevenueCat: async (userId) => {
    try {
      if (Platform.OS === "android") {
        await Purchases.configure({ apiKey: RC_GOOGLE_KEY, appUserID: userId });
      }
      Purchases.setLogLevel(LOG_LEVEL.ERROR);

      // Listen for customer info updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        const isPremium = isPremiumFromCustomerInfo(info);
        const expiresAt =
          info.entitlements.active["premium"]?.expirationDate ?? null;
        set({ isPremium, premiumExpiresAt: expiresAt });

        // Sync to Firestore
        if (userId && userId !== "guest") {
          userDoc(userId)
            .update({ is_premium: isPremium, premium_expires_at: expiresAt })
            .catch(() => {});
        }
      });

      set({ isInitialized: true });
    } catch (e) {
      console.error("RevenueCat init error:", e);
    }
  },

  loadSubscription: async (userId) => {
    if (userId === "guest") return;

    try {
      // Load from RevenueCat if initialized
      const { isInitialized } = get();
      if (isInitialized) {
        const info = await Purchases.getCustomerInfo();
        const isPremium = isPremiumFromCustomerInfo(info);
        const expiresAt =
          info.entitlements.active["premium"]?.expirationDate ?? null;
        set({ isPremium, premiumExpiresAt: expiresAt });
      } else {
        // Fallback to Firestore
        const snap = await userDoc(userId).get();
        const data = snap.data() ?? {};
        const premiumExpiresAt: string | null = data.premium_expires_at ?? null;
        const isPremium =
          data.is_premium === true &&
          (premiumExpiresAt ? new Date(premiumExpiresAt) > new Date() : false);
        set({ isPremium, premiumExpiresAt });
      }

      // Daily usage
      const snap = await userDoc(userId).get();
      const data = snap.data() ?? {};
      const today = todayString();
      const savedDate: string = data.usage_date ?? today;
      const savedCount: number = data.lessons_started_today ?? 0;
      const lessonsStartedToday = savedDate === today ? savedCount : 0;
      set({ lessonsStartedToday, usageDate: today });
    } catch {
      // Offline — keep existing local state
    }
  },

  canStartLesson: () => {
    const { isPremium, lessonsStartedToday, usageDate } = get();
    if (isPremium) return true;
    const today = todayString();
    const count = usageDate === today ? lessonsStartedToday : 0;
    return count < FREE_DAILY_LIMIT;
  },

  recordLessonStarted: async (userId) => {
    const today = todayString();
    const { usageDate, lessonsStartedToday } = get();
    const newCount = usageDate === today ? lessonsStartedToday + 1 : 1;
    set({ lessonsStartedToday: newCount, usageDate: today });
    if (userId === "guest") return;
    try {
      await userDoc(userId).update({
        lessons_started_today: newCount,
        usage_date: today,
      });
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

      set({ isPremium, premiumExpiresAt: expiresAt });
      return { success: isPremium };
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
    const { isPremium, lessonsStartedToday, usageDate } = get();
    if (isPremium) return Infinity;
    const today = todayString();
    const used = usageDate === today ? lessonsStartedToday : 0;
    return Math.max(0, FREE_DAILY_LIMIT - used);
  },
}));
