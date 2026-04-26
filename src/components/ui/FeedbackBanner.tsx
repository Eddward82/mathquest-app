import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";

interface FeedbackBannerProps {
  isCorrect: boolean;
  explanation: string;
  visible: boolean;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  isCorrect,
  explanation,
  visible,
}) => {
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const shimmerX = useSharedValue(-100);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        isCorrect
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
      );
      translateY.value = withSpring(0, { stiffness: 380, damping: 22 });
      opacity.value = withTiming(1, { duration: 180 });
      iconScale.value = withSequence(
        withSpring(1.3, { stiffness: 600, damping: 12 }),
        withSpring(1, { stiffness: 400, damping: 14 })
      );
      if (isCorrect) {
        shimmerX.value = withRepeat(
          withSequence(
            withTiming(-100, { duration: 0 }),
            withTiming(300, { duration: 1200 })
          ),
          -1,
          false
        );
      }
    } else {
      translateY.value = withTiming(120, { duration: 220 });
      opacity.value = withTiming(0, { duration: 160 });
      iconScale.value = withTiming(0, { duration: 160 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const correctGradient: [string, string] = ["#22C55E", "#16A34A"];
  const wrongGradient: [string, string] = ["#F87171", "#DC2626"];
  const gradient = isCorrect ? correctGradient : wrongGradient;

  const title = isCorrect ? "Correct! ✨" : "Not quite...";
  const iconName = isCorrect ? "check-circle" : "x-circle";

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Shimmer overlay for correct answers */}
        {isCorrect && (
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        )}

        {/* Decorative orb */}
        <View style={styles.orb} />

        <View style={styles.header}>
          <Animated.View style={iconStyle}>
            <View style={styles.iconCircle}>
              <Feather name={iconName} size={22} color={isCorrect ? "#22C55E" : "#EF4444"} />
            </View>
          </Animated.View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <Text style={styles.explanation}>{explanation}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  container: {
    padding: 18,
    gap: 10,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.18)",
    transform: [{ skewX: "-20deg" }],
  },
  orb: {
    position: "absolute",
    top: -24,
    right: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    color: "rgba(255,255,255,0.92)",
    paddingLeft: 4,
  },
});
