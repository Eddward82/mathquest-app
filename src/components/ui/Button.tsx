import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const SIZE: Record<Size, { px: number; py: number; fontSize: number; radius: number }> = {
  sm: { px: 16, py: 10, fontSize: 14, radius: 12 },
  md: { px: 24, py: 14, fontSize: 16, radius: 14 },
  lg: { px: 28, py: 17, fontSize: 17, radius: 18 },
};

const GRADIENT: Record<Variant, [string, string] | null> = {
  primary: [COLORS.primary, "#8B5CF6"],
  secondary: [COLORS.secondary, "#F97316"],
  success: [COLORS.success, "#16A34A"],
  danger: [COLORS.danger, "#DC2626"],
  ghost: null,
  outline: null,
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = "primary", size = "md",
  disabled = false, loading = false, icon, fullWidth = false,
}) => {
  const scale = useSharedValue(1);
  const s = SIZE[size];
  const gradient = GRADIENT[variant];

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => { scale.value = withSpring(0.96, { stiffness: 500, damping: 20 }); };
  const onPressOut = () => { scale.value = withSpring(1, { stiffness: 500, damping: 20 }); };

  const isFlat = variant === "ghost" || variant === "outline";

  const flatBg = variant === "ghost" ? "transparent" : "transparent";
  const flatBorder = variant === "outline" ? COLORS.primary : "transparent";
  const flatTextColor = variant === "outline" || variant === "ghost" ? COLORS.primary : COLORS.white;

  const disabledStyle = disabled ? styles.disabled : {};

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        styles.base,
        { borderRadius: s.radius, width: fullWidth ? "100%" : undefined },
        isFlat && { paddingHorizontal: s.px, paddingVertical: s.py, borderWidth: variant === "outline" ? 2 : 0, borderColor: flatBorder, backgroundColor: flatBg },
        disabledStyle,
        animStyle,
      ]}
    >
      {gradient && !disabled ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientInner, { paddingHorizontal: s.px, paddingVertical: s.py }]}
        >
          <Inner loading={loading} icon={icon} title={title} fontSize={s.fontSize} color="#FFFFFF" />
        </LinearGradient>
      ) : (
        <Inner loading={loading} icon={icon} title={title} fontSize={s.fontSize} color={disabled ? "#94A3B8" : flatTextColor} />
      )}
    </AnimatedTouchable>
  );
};

const Inner: React.FC<{ loading: boolean; icon?: React.ReactNode; title: string; fontSize: number; color: string }> = ({
  loading, icon, title, fontSize, color,
}) =>
  loading ? (
    <ActivityIndicator color={color} size="small" />
  ) : (
    <View style={styles.row}>
      {icon && <View style={styles.iconGap}>{icon}</View>}
      <Text style={[styles.label, { fontSize, color }]}>{title}</Text>
    </View>
  );

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientInner: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconGap: { marginRight: 8 },
  label: { fontWeight: "800", letterSpacing: 0.2 },
});
