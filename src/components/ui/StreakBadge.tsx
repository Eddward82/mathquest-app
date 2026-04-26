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
          backgroundColor: isActive ? "#FFF7ED" : "#F1F5F9",
          borderColor: isActive ? "#FED7AA" : "#E2E8F0",
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
