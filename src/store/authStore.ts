import { create } from "zustand";
import { auth, firestore, userDoc } from "../lib/firebase";
import { User, SkillLevel, UserGoal, TopicCategory } from "../types";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: "420810329731-kigurj0h8ns5pidmjmok368085t9ed98.apps.googleusercontent.com",
});

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateSkillLevel: (level: SkillLevel) => Promise<void>;
  updateOnboarding: (data: { goal: UserGoal; daily_target_minutes: number; focus_topics: TopicCategory[] }) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isGuest: false,
  error: null,

  signUp: async (email, password, username) => {
    set({ isLoading: true, error: null });
    try {
      // Create Firebase Auth user
      const { user: fbUser } = await auth().createUserWithEmailAndPassword(
        email,
        password
      );

      // Update display name
      await fbUser.updateProfile({ displayName: username });

      // Create Firestore user profile document
      const profile: User = {
        id: fbUser.uid,
        email,
        username,
        skill_level: "beginner",
        created_at: new Date().toISOString(),
      };

      await userDoc(fbUser.uid).set({
        ...profile,
        display_name: username,
        total_xp: 0,
        current_level: 1,
      });

      // Create initial streak document
      await firestore()
        .collection("users")
        .doc(fbUser.uid)
        .collection("streaks")
        .doc("data")
        .set({
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
        });

      // Send verification email
      await fbUser.sendEmailVerification();

      set({ user: profile, isGuest: false, error: "verify_email" });
    } catch (err: any) {
      console.log("SIGNUP ERROR:", err.code, err.message);
      set({ error: formatFirebaseError(err.code) });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user: fbUser } = await auth().signInWithEmailAndPassword(
        email,
        password
      );

      // Block unverified email users
      if (!fbUser.emailVerified) {
        await auth().signOut();
        set({ error: "verify_email" });
        return;
      }

      // Fetch Firestore profile
      const snap = await userDoc(fbUser.uid).get();

      if (snap.exists) {
        set({ user: snap.data() as User, isGuest: false });
      } else {
        // Fallback if profile doc is missing
        set({
          user: {
            id: fbUser.uid,
            email: fbUser.email ?? "",
            username: fbUser.displayName ?? email.split("@")[0],
            skill_level: "beginner",
            created_at: fbUser.metadata.creationTime ?? new Date().toISOString(),
          },
          isGuest: false,
        });
      }
    } catch (err: any) {
      console.log("SIGNIN ERROR:", err.code, err.message);
      set({ error: formatFirebaseError(err.code) });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      await GoogleSignin.hasPlayServices();
      // Sign out first to force the account picker to always appear
      await GoogleSignin.signOut();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error("No ID token returned from Google");

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const { user: fbUser } = await auth().signInWithCredential(googleCredential);

      const snap = await userDoc(fbUser.uid).get();
      if (snap.exists) {
        set({ user: snap.data() as User, isGuest: false });
      } else {
        const username = fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User";
        const profile: User = {
          id: fbUser.uid,
          email: fbUser.email ?? "",
          username,
          skill_level: "beginner",
          created_at: new Date().toISOString(),
        };
        await userDoc(fbUser.uid).set({ ...profile, display_name: username, total_xp: 0, current_level: 1 });
        await firestore().collection("users").doc(fbUser.uid).collection("streaks").doc("data").set({
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null,
        });
        set({ user: profile, isGuest: false });
      }
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error message needed
      } else if (err.code === statusCodes.IN_PROGRESS) {
        set({ error: "Sign-in already in progress." });
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        set({ error: "Google Play Services not available." });
      } else {
        console.log("GOOGLE SIGNIN ERROR:", err);
        set({ error: "Google sign-in failed. Please try again." });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await auth().signOut();
      set({ user: null, isGuest: false });
    } finally {
      set({ isLoading: false });
    }
  },


  updateSkillLevel: async (level) => {
    const { user, isGuest } = get();
    if (!user) return;
    set({ user: { ...user, skill_level: level } });
    if (!isGuest) await userDoc(user.id).update({ skill_level: level });
  },

  updateOnboarding: async ({ goal, daily_target_minutes, focus_topics }) => {
    const { user, isGuest } = get();
    if (!user) return;
    const updated = { ...user, goal, daily_target_minutes, focus_topics };
    set({ user: updated });
    if (!isGuest) {
      await userDoc(user.id).update({ goal, daily_target_minutes, focus_topics });
    }
  },

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}));

// ─── Map Firebase error codes to user-friendly messages ──────────────────────
function formatFirebaseError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "No internet connection. Please check your network.";
    default:
      return "Something went wrong. Please try again.";
  }
}
