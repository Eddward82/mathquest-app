import { TOPICS } from "../data/lessons";

// ─── Achievement unlock rules ─────────────────────────────────────────────────
// Data-driven so adding/renaming lessons or topics never silently breaks an
// achievement (the previous implementation hardcoded lists of lesson IDs).

// Threshold achievements: [achievementId, requiredValue]
export const LESSON_COUNT_ACHIEVEMENTS: [string, number][] = [
  ["ach_first_lesson", 1],
  ["ach_lessons_25", 25],
  ["ach_lessons_50", 50],
];

export const STREAK_ACHIEVEMENTS: [string, number][] = [
  ["ach_streak_3", 3],
  ["ach_streak_7", 7],
  ["ach_streak_30", 30],
];

export const XP_ACHIEVEMENTS: [string, number][] = [
  ["ach_xp_100", 100],
  ["ach_xp_500", 500],
  ["ach_xp_1000", 1000],
  ["ach_xp_2500", 2500],
];

// Topic-completion achievements: achievementId → topicId.
// Completion is derived from the live TOPICS data, not a hardcoded ID list.
export const TOPIC_ACHIEVEMENTS: Record<string, string> = {
  ach_arithmetic: "topic_arithmetic",
  ach_algebra: "topic_algebra",
  ach_geometry: "topic_geometry",
  ach_stats: "topic_statistics",
  ach_ratio: "topic_ratio",
};

export interface AchievementStats {
  lessonsCompleted: number;
  currentStreak: number;
  totalXP: number;
  completedLessonIds: Set<string>;
  completedReviewsCount: number;
}

/**
 * Returns the list of achievement IDs that the given stats qualify for.
 * Already-unlocked filtering is handled by the caller (unlockAchievement is
 * idempotent), so this stays a pure function of the stats.
 */
export function achievementsToUnlock(stats: AchievementStats): string[] {
  const unlocked: string[] = [];

  for (const [id, n] of LESSON_COUNT_ACHIEVEMENTS) {
    if (stats.lessonsCompleted >= n) unlocked.push(id);
  }
  for (const [id, n] of STREAK_ACHIEVEMENTS) {
    if (stats.currentStreak >= n) unlocked.push(id);
  }
  for (const [id, n] of XP_ACHIEVEMENTS) {
    if (stats.totalXP >= n) unlocked.push(id);
  }

  for (const [achId, topicId] of Object.entries(TOPIC_ACHIEVEMENTS)) {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (
      topic &&
      topic.lessons.length > 0 &&
      topic.lessons.every((l) => stats.completedLessonIds.has(l.id))
    ) {
      unlocked.push(achId);
    }
  }

  if (stats.completedReviewsCount >= 1) unlocked.push("ach_review_first");

  return unlocked;
}
