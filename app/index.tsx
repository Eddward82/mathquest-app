import { useEffect } from "react";
import { Redirect } from "expo-router";
import { auth, userDoc } from "../src/lib/firebase";
import { useAuthStore } from "../src/store/authStore";
import { useSubscriptionStore } from "../src/store/subscriptionStore";
import { useProgressStore } from "../src/store/progressStore";

// Root entry point — subscribes to Firebase Auth state and redirects accordingly
export default function Index() {
  const { user, setUser } = useAuthStore();
  const { loadSubscription } = useSubscriptionStore();
  const { loadProgress } = useProgressStore();

  useEffect(() => {
    // onAuthStateChanged fires immediately with the current session (or null)
    // and on every subsequent sign-in / sign-out event.
    const unsubscribe = auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        // Try to load the full profile from Firestore
        try {
          const snap = await userDoc(fbUser.uid).get();
          if (snap.exists) {
            setUser(snap.data() as any);
          } else {
            // Profile doc not yet created — use Auth data as fallback
            setUser({
              id: fbUser.uid,
              email: fbUser.email ?? "",
              username: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
              skill_level: "beginner",
              created_at: fbUser.metadata.creationTime ?? new Date().toISOString(),
            });
          }
        } catch {
          // Offline — still let the user in with basic info
          setUser({
            id: fbUser.uid,
            email: fbUser.email ?? "",
            username: fbUser.displayName ?? "User",
            skill_level: "beginner",
            created_at: new Date().toISOString(),
          });
        }

        // Load subscription status and progress in parallel
        await Promise.allSettled([
          loadSubscription(fbUser.uid),
          loadProgress(fbUser.uid),
        ]);
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
