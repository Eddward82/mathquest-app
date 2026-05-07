import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { scheduleDailyStreakReminder } from "../src/lib/notifications";
import { useSubscriptionStore } from "../src/store/subscriptionStore";
import "../src/styles/global.css";

// Keep splash screen up until app is ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initRevenueCat } = useSubscriptionStore();

  useEffect(() => {
    SplashScreen.hideAsync();
    scheduleDailyStreakReminder(19, 0).catch(() => {});
    // Initialize RevenueCat early so paywall works even before login
    initRevenueCat("").catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="lesson/[id]"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="review/[topicId]"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="practice/[topicId]"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="daily-challenge"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
