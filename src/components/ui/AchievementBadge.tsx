import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, BORDER_RADIUS, SHADOWS } from "../../constants/theme";
import { Achievement } from "../../types";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  unlocked = false,
}) => {
  return (
    <View style={[styles.container, !unlocked && styles.locked]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: unlocked ? COLORS.primaryLight : "#F1F5F9" },
        ]}
      >
        <Feather
          name={achievement.icon as any}
          size={22}
          color={unlocked ? COLORS.primary : COLORS.textMuted}
        />
      </View>
      <Text
        style={[styles.title, { color: unlocked ? COLORS.textPrimary : COLORS.textMuted }]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
      {unlocked && (
        <Text style={styles.xp}>+{achievement.xp_reward} XP</Text>
      )}
      {!unlocked && (
        <View style={styles.lockIcon}>
          <Feather name="lock" size={12} color={COLORS.textMuted} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 90,
    alignItems: "center",
    gap: 6,
    padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  locked: {
    opacity: 0.55,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },
  xp: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "700",
  },
  lockIcon: {
    position: "absolute",
    top: 6,
    right: 6,
  },
});
