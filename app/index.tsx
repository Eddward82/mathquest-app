import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Redirect } from "expo-router";
import { auth, userDoc } from "../src/lib/firebase";
import { useAuthStore } from "../src/store/authStore";
import { useSubscriptionStore } from "../src/store/subscriptionStore";
import { useProgressStore } from "../src/store/progressStore";

// Root entry point — subscribes to Firebase Auth state and redirects accordingly
export default function Index() {
  const { user, setUser } = useAuthStore();
  const { loadSubscription, initRevenueCat } = useSubscriptionStore();
  const { loadProgress } = useProgressStore();
  const currentUid = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        currentUid.current = fbUser.uid;
        try {
          const snap = await userDoc(fbUser.uid).get();
          if (snap.exists) {
            setUser(snap.data() as any);
          } else {
            setUser({
              id: fbUser.uid,
              email: fbUser.email ?? "",
              username: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
              skill_level: "beginner",
              created_at: fbUser.metadata.creationTime ?? new Date().toISOString(),
            });
          }
        } catch {
          setUser({
            id: fbUser.uid,
            email: fbUser.email ?? "",
            username: fbUser.displayName ?? "User",
            skill_level: "beginner",
            created_at: new Date().toISOString(),
          });
        }

        await initRevenueCat(fbUser.uid);
        await Promise.allSettled([
          loadSubscription(fbUser.uid),
          loadProgress(fbUser.uid),
        ]);
      } else {
        currentUid.current = null;
        setUser(null);
      }
    });

    // Re-check premium status every time the app comes back to foreground
    const appStateListener = AppState.addEventListener("change", async (state: AppStateStatus) => {
      if (state === "active" && currentUid.current) {
        loadSubscription(currentUid.current).catch(() => {});
      }
    });

    return () => {
      unsubscribe();
      appStateListener.remove();
    };
  }, []);

  if (user) {
    if (!user.onboarding_completed && !user.goal) {
      return <Redirect href="/onboarding" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
