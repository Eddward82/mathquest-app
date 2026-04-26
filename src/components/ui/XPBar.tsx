import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { COLORS, XP_PER_LEVEL, LEVEL_NAMES } from "../../constants/theme";

interface XPBarProps {
  totalXP: number;
  currentLevel: number;
  compact?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({ totalXP, currentLevel, compact = false }) => {
  const xpInCurrentLevel = totalXP % XP_PER_LEVEL;
  const progressPercent = (xpInCurrentLevel / XP_PER_LEVEL) * 100;
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progressPercent, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressPercent]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  const levelName = LEVEL_NAMES[currentLevel] ?? `Level ${currentLevel}`;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactTrack}>
          <Animated.View style={[styles.fill, barStyle]} />
        </View>
        <Text style={styles.compactXP}>{xpInCurrentLevel}/{XP_PER_LEVEL} XP</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNum}>{currentLevel}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.levelName}>{levelName}</Text>
          <Text style={styles.xpText}>
            {xpInCurrentLevel} / {XP_PER_LEVEL} XP to Level {currentLevel + 1}
          </Text>
        </View>
        <Text style={styles.totalXP}>{totalXP} XP total</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNum: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  levelName: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  xpText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  totalXP: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  track: {
    height: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 99,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 99,
    overflow: "hidden",
  },
  compactXP: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});
