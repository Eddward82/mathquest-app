import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

// The MathQuest logo (operator tiles). The abacus is only for the startup
// screen — use this everywhere else the brand appears.
const LOGO = require("../../../assets/logo.png");

interface AppLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function AppLogo({ size = 64, style }: AppLogoProps) {
  return (
    <Image
      source={LOGO}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="MathQuest logo"
    />
  );
}
