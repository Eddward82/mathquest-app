import { create } from "zustand";
import { userDoc } from "../lib/firebase";

// ─── Constants ────────────────────────────────────────────────────────────────
export const FREE_DAILY_LIMIT = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function isPremiumActive(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type PlanId = "monthly" | "yearly" | "lifetime";

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
    price: "$4.99",
    perMonth: "$4.99/mo",
    badge: null,
    highlight: false,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "$29.99",
    perMonth: "$2.50/mo",
    badge: "Best Value",
    highlight: true,
  },
  {
    id: "lifetime",
    label: "Lifetime",
    price: "$79.99",
    perMonth: "One-time",
    badge: null,
    highlight: false,
  },
];

interface SubscriptionState {
  isPremium: boolean;
  premiumExpiresAt: string | null;

  // Daily usage tracking (stored locally + Firestore)
  lessonsStartedToday: number;
  usageDate: string; // "YYYY-MM-DD" — resets when date changes

  // Actions
  loadSubscription: (userId: string) => Promise<void>;
  canStartLesson: () => boolean;
  recordLessonStarted: (userId: string) => Promise<void>;
  activatePremium: (userId: string, planId: PlanId) => Promise<void>;
  cancelPremium: (userId: string) => Promise<void>;
  remainingToday: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPremium: false,
  premiumExpiresAt: null,
  lessonsStartedToday: 0,
  usageDate: todayString(),

  loadSubscription: async (userId) => {
    if (userId === "guest") return;

    try {
      const snap = await userDoc(userId).get();
      const data = snap.data() ?? {};

      const premiumExpiresAt: string | null = data.premium_expires_at ?? null;
      const isPremium = data.is_premium === true && isPremiumActive(premiumExpiresAt);

      // Daily usage
      const today = todayString();
      const savedDate: string = data.usage_date ?? today;
      const savedCount: number = data.lessons_started_today ?? 0;
      const lessonsStartedToday = savedDate === today ? savedCount : 0;

      set({ isPremium, premiumExpiresAt, lessonsStartedToday, usageDate: today });
    } catch {
      // Offline — keep existing local state
    }
  },

  canStartLesson: () => {
    const { isPremium, lessonsStartedToday, usageDate } = get();
    if (isPremium) return true;

    // Reset count if day has rolled over
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

  activatePremium: async (userId, planId) => {
    const expiresAt = computeExpiry(planId);

    set({ isPremium: true, premiumExpiresAt: expiresAt });

    if (userId === "guest") return;

    try {
      await userDoc(userId).update({
        is_premium: true,
        premium_plan: planId,
        premium_activated_at: new Date().toISOString(),
        premium_expires_at: expiresAt,
      });
    } catch {
      // Optimistic — local state already updated
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeExpiry(planId: PlanId): string | null {
  if (planId === "lifetime") return null; // never expires

  const d = new Date();
  if (planId === "monthly") d.setMonth(d.getMonth() + 1);
  if (planId === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
