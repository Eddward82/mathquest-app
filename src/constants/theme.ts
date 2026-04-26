export const COLORS = {
  primary: "#6C63FF",
  primaryLight: "#EEF2FF",
  primaryDark: "#4640B8",

  secondary: "#FF6B35",
  secondaryLight: "#FFF7ED",

  success: "#58CC02",
  successLight: "#F0FDF4",
  successDark: "#16A34A",

  danger: "#FF4B4B",
  dangerLight: "#FFF1F2",
  dangerDark: "#DC2626",

  gold: "#EAB308",
  goldLight: "#FEF9C3",

  // Neutrals
  white: "#FFFFFF",
  black: "#0A0A0A",
  surface: "#F8F9FF",
  card: "#FFFFFF",

  // Text
  textPrimary: "#1A1A2E",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",

  // Borders
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // Topic colors
  arithmetic: "#6C63FF",
  algebra: "#FF6B35",
  geometry: "#58CC02",
  word_problems: "#EAB308",
} as const;

export const FONTS = {
  regular: "System",
  medium: "System",
  semibold: "System",
  bold: "System",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// XP required per level
export const XP_PER_LEVEL = 500;

export const LEVEL_NAMES: Record<number, string> = {
  1: "Novice",
  2: "Explorer",
  3: "Apprentice",
  4: "Scholar",
  5: "Adept",
  6: "Expert",
  7: "Master",
  8: "Grandmaster",
  9: "Legend",
  10: "Mathlete",
};
