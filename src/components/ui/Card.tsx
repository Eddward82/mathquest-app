import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { COLORS, BORDER_RADIUS, SHADOWS } from "../../constants/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: "sm" | "md" | "lg" | "none";
  padding?: number;
  radius?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  shadow = "sm",
  padding = 16,
  radius = BORDER_RADIUS.lg,
}) => {
  const shadowStyle = shadow === "none" ? {} : SHADOWS[shadow];

  return (
    <View
      style={[
        styles.card,
        { padding, borderRadius: radius, ...shadowStyle },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
