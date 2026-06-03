import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

// ─── Re-export Firebase services for use across the app ──────────────────────
// Firebase is configured via google-services.json (Android) and
// GoogleService-Info.plist (iOS) — no manual init needed with the
// React Native Firebase native module approach.

export { auth, firestore };

// ─── Firestore collection helpers ────────────────────────────────────────────
// Centralise collection paths so they're easy to change in one place.

export const Collections = {
  users: "users",
  progress: "progress",           // subcollection: users/{uid}/progress
  streaks: "streaks",             // subcollection: users/{uid}/streaks  (single doc "data")
  achievements: "achievements",   // subcollection: users/{uid}/achievements
  reviews: "reviews",             // subcollection: users/{uid}/reviews
} as const;

// Helper: user document ref
export const userDoc = (uid: string) =>
  firestore().collection(Collections.users).doc(uid);

// Helper: progress subcollection ref under a user
export const progressCol = (uid: string) =>
  userDoc(uid).collection(Collections.progress);

// Helper: streak document ref (single doc per user)
export const streakDoc = (uid: string) =>
  userDoc(uid).collection(Collections.streaks).doc("data");

// Helper: achievements subcollection ref under a user
export const achievementsCol = (uid: string) =>
  userDoc(uid).collection(Collections.achievements);

// Helper: topic reviews subcollection ref under a user
export const reviewsCol = (uid: string) =>
  userDoc(uid).collection(Collections.reviews);

// ─── Firestore field name constants ──────────────────────────────────────────
export const Fields = {
  is_premium: "is_premium",
  premium_expires_at: "premium_expires_at",
  total_xp: "total_xp",
  current_level: "current_level",
  skill_level: "skill_level",
  lessons_started_total: "lessons_started_total",
  adaptive_difficulty_score: "adaptive_difficulty_score",
  daily_challenge_completed_date: "daily_challenge_completed_date",
  onboarding_completed: "onboarding_completed",
  last_activity_date: "last_activity_date",
  current_streak: "current_streak",
  longest_streak: "longest_streak",
} as const;
