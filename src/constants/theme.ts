export const COLORS = {
  // Brand / accent
  primary: "#FFCA3A",         // golden amber — XP, CTAs
  primaryLight: "rgba(255,202,58,0.12)",
  primaryDark: "#E5A800",

  secondary: "#818CF8",       // indigo — levels, stats
  secondaryLight: "rgba(129,140,248,0.12)",

  success: "#6BCB77",         // mint green — correct answers
  successLight: "rgba(107,203,119,0.12)",
  successDark: "#3FB54A",

  danger: "#FF595E",          // coral red — wrong answers
  dangerLight: "rgba(255,89,94,0.12)",
  dangerDark: "#E02020",

  gold: "#FFCA3A",
  goldLight: "rgba(255,202,58,0.10)",

  // Streak
  streak: "#FF9F1C",
  streakLight: "rgba(255,159,28,0.12)",

  // Backgrounds
  white: "#FFFFFF",
  black: "#0A0C1E",
  surface: "#0A0C1E",         // page background — deep midnight
  card: "#171A30",            // card surface
  cardAlt: "#1E2038",         // elevated/hover card

  // Text
  textPrimary: "#E8EDF5",
  textSecondary: "#6B7494",
  textMuted: "#363B6B",

  // Borders
  border: "#252848",
  borderLight: "#1C1F3B",

  // Topic colors (vibrant for dark backgrounds)
  arithmetic: "#818CF8",      // indigo
  algebra: "#FB7185",         // rose
  geometry: "#34D399",        // emerald
  word_problems: "#FBBF24",   // amber
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// XP required to advance one level (linear progression curve)
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
