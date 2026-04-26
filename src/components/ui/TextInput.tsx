import React, { useState } from "react";
import {
  View,
  TextInput as RNTextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps as RNTextInputProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
  secureToggle?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  icon,
  secureToggle,
  secureTextEntry,
  style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? COLORS.danger
    : focused
    ? COLORS.primary
    : COLORS.border;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          { borderColor, borderWidth: focused ? 2 : 1.5 },
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={focused ? COLORS.primary : COLORS.textMuted}
            style={styles.icon}
          />
        )}
        <RNTextInput
          style={[styles.input, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureToggle ? !showPassword : secureTextEntry}
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: 14,
    height: 52,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeIcon: {
    padding: 4,
  },
  error: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: "500",
  },
});
