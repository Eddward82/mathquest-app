import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

// Root entry point — redirects based on the signed-in user. The Firebase Auth
// listener that loads the user lives in app/_layout.tsx.
export default function Index() {
  const { user } = useAuthStore();

  if (user) {
    if (!user.onboarding_completed && !user.goal) {
      return <Redirect href="/onboarding" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
