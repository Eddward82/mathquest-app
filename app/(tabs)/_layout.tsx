import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../src/constants/theme";

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

function TabIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
  color: string;
}) {
  const scale = useSharedValue(focused ? 1 : 1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Bounce on focus
  if (focused) {
    scale.value = withSpring(1.18, { damping: 10, stiffness: 260 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 260 });
    });
  }

  return (
    <Animated.View style={[styles.iconWrap, focused && styles.iconWrapActive, animStyle]}>
      <Feather
        name={name}
        size={21}
        color={focused ? COLORS.primary : "#9CA3AF"}
      />
      {focused && <View style={styles.activeDot} />}
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#9CA3AF",
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
    borderTopWidth: 0,
    height: Platform.OS === "ios" ? 88 : 72,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingTop: 10,
    // Pronounced shadow that lifts the bar
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 16,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 1,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 36,
    borderRadius: 12,
    gap: 3,
  },
  iconWrapActive: {
    backgroundColor: "#EEF2FF",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
