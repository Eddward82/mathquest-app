import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

interface DifficultyToastProps {
  event: "increased" | "decreased" | null;
  onDone: () => void;
}

const CONFIGS = {
  increased: {
    icon: "trending-up" as const,
    title: "Levelling up!",
    body: "3 correct in a row — questions are getting harder 🔥",
    bg: "#FFF1F2",
    border: "#FCA5A5",
    color: "#DC2626",
    iconBg: "#FEE2E2",
  },
  decreased: {
    icon: "trending-down" as const,
    title: "No worries!",
    body: "Taking it a step back — let's reinforce the basics 💪",
    bg: "#FEFCE8",
    border: "#FDE68A",
    color: "#92400E",
    iconBg: "#FEF3C7",
  },
};

export const DifficultyToast: React.FC<DifficultyToastProps> = ({ event, onDone }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!event) return;

    // Slide in
    translateY.value = withSpring(0, { stiffness: 320, damping: 24 });
    opacity.value = withTiming(1, { duration: 200 });

    // After 2.8s, slide out and call onDone
    translateY.value = withDelay(
      2800,
      withSpring(-100, { stiffness: 300, damping: 22 })
    );
    opacity.value = withDelay(
      2800,
      withTiming(0, { duration: 260 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })
    );
  }, [event]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!event) return null;
  const cfg = CONFIGS[event];

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <View style={[styles.toast, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
          <Feather name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={styles.textArea}>
          <Text style={[styles.title, { color: cfg.color }]}>{cfg.title}</Text>
          <Text style={styles.body}>{cfg.body}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textArea: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: "800", letterSpacing: -0.1 },
  body: { fontSize: 12, color: "#6B7280", fontWeight: "500", lineHeight: 17 },
});
