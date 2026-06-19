import { useEffect, Component, ReactNode } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { scheduleDailyStreakReminder } from "../src/lib/notifications";
import { useSubscriptionStore } from "../src/store/subscriptionStore";

// Keep splash screen up until app is ready
SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>😕</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.sub}>Please restart the app.</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })} style={errorStyles.btn}>
            <Text style={errorStyles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#F8F9FF" },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "800", color: "#1A1A2E", marginBottom: 8 },
  sub: { fontSize: 15, color: "#64748B", marginBottom: 24 },
  btn: { backgroundColor: "#6C63FF", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default function RootLayout() {
  const { initRevenueCat } = useSubscriptionStore();

  useEffect(() => {
    SplashScreen.hideAsync();
    scheduleDailyStreakReminder(19, 0).catch(() => {});
    // Initialize RevenueCat early so paywall works even before login
    initRevenueCat("").catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
