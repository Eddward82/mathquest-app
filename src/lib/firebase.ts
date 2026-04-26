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
  userDoc(uid).collection("reviews");
