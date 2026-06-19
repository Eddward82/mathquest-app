import { XP_PER_LEVEL } from "../constants/theme";

// ─── Pure progression math ────────────────────────────────────────────────────
// Extracted from the stores so the gamification rules can be unit-tested in
// isolation (no Firestore / React Native dependencies).

export type AdaptiveDifficultyLevel = "easier" | "normal" | "harder";

// Adaptive difficulty score is clamped to this range.
export const DIFFICULTY_SCORE_MIN = -5;
export const DIFFICULTY_SCORE_MAX = 5;

/** Level derived from total XP (linear curve). Level 1 is the floor. */
export function computeLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** Map the cumulative adaptive-difficulty score to a display label. */
export function scoreToLevel(score: number): AdaptiveDifficultyLevel {
  if (score >= 2) return "harder";
  if (score <= -2) return "easier";
  return "normal";
}

/** Clamp the cumulative adaptive-difficulty score to its valid range. */
export function clampDifficultyScore(score: number): number {
  return Math.max(DIFFICULTY_SCORE_MIN, Math.min(DIFFICULTY_SCORE_MAX, score));
}

/**
 * Compute the new daily streak.
 * - Same day as last activity → unchanged (treated as already counted today).
 * - Activity yesterday → streak continues (+1).
 * - Otherwise → streak resets to 1 (broken streak or first ever).
 * Dates are compared as YYYY-MM-DD strings.
 */
export function computeStreak(params: {
  lastDate: string | null;
  today: string;
  yesterday: string;
  currentStreak: number;
}): number {
  const { lastDate, today, yesterday, currentStreak } = params;
  if (lastDate === today) return currentStreak || 1;
  if (lastDate === yesterday) return currentStreak + 1;
  return 1;
}
