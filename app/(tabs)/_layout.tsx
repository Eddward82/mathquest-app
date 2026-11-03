import { Tabs } from "expo-router";
import { StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../src/constants/theme";
import React, { useEffect, memo } from "react";

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: "home",
  learn: "book-open",
  leaderboard: "bar-chart-2",
  profile: "user",
};

const LABELS: Record<string, string> = {
  index: "Home",
  learn: "Learn",
  leaderboard: "Ranks",
  profile: "Profile",
};

const TabIcon = memo(function TabIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
  color: string;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.18, { damping: 10, stiffness: 260 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
      });
    }
  }, [focused]);

  return (
    <Animated.View style={[styles.iconWrap, focused && styles.iconWrapActive, animStyle]}>
      <Feather
        name={name}
        size={20}
        color={focused ? COLORS.primary : "#94A3B8"}
      />
    </Animated.View>
  );
});

export default function TabLayout() {
  // Android 16 (targetSdk 36) always draws edge-to-edge, so the bar must clear
  // the system navigation bar itself — 3-button nav is much taller than 12px.
  const insets = useSafeAreaInsets();
  const androidBottom = Math.max(insets.bottom, 12);
  const tabBarStyle = Platform.OS === "android"
    ? [styles.tabBar, { height: 60 + androidBottom, paddingBottom: androidBottom }]
    : styles.tabBar;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      }}
    >
      {(["index", "learn", "leaderboard", "profile"] as const).map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: LABELS[name],
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name={ICONS[name]} focused={focused} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    height: Platform.OS === "ios" ? 88 : 72,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingTop: 8,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: -0.1,
    marginTop: 2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 28,
    borderRadius: 14,
  },
  iconWrapActive: {
    backgroundColor: "#EEF2FF",
  },
});
