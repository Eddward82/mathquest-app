import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, size = "md" }) => {
  const isActive = streak > 0;

  const config = {
    sm: { iconSize: 14, fontSize: 13, padding: 6, gap: 4 },
    md: { iconSize: 18, fontSize: 16, padding: 10, gap: 6 },
    lg: { iconSize: 26, fontSize: 22, padding: 14, gap: 8 },
  }[size];

  return (
    <View
      style={[
        styles.badge,
        {
          padding: config.padding,
          backgroundColor: isActive ? "rgba(255,159,28,0.12)" : "#1E2038",
          borderColor: isActive ? "rgba(255,159,28,0.3)" : "#252848",
        },
      ]}
    >
      <Feather
        name="zap"
        size={config.iconSize}
        color={isActive ? COLORS.secondary : COLORS.textMuted}
      />
      <Text
        style={[
          styles.count,
          {
            fontSize: config.fontSize,
            color: isActive ? COLORS.secondary : COLORS.textMuted,
            marginLeft: config.gap,
          },
        ]}
      >
        {streak}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 99,
    borderWidth: 1.5,
  },
  count: {
    fontWeight: "800",
  },
});
