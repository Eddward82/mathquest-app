import { create } from "zustand";
import { firestore, userDoc, progressCol, streakDoc, achievementsCol, reviewsCol } from "../lib/firebase";
import { TOPICS } from "../data/lessons";
import { ACHIEVEMENTS } from "../data/achievements";
import { Achievement, Topic, UserProgress } from "../types";
import { DifficultyDelta } from "./lessonStore";
import {
  AdaptiveDifficultyLevel,
  computeLevel,
  scoreToLevel,
  clampDifficultyScore,
  computeStreak,
} from "../lib/progressMath";
import { achievementsToUnlock } from "../lib/achievementRules";

export type { AdaptiveDifficultyLevel };

interface ProgressState {
  // Gamification state
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  lessonsCompleted: number;

  // Lesson state
  completedLessonIds: Set<string>;
  topics: Topic[];

  // Achievements
  unlockedAchievements: Achievement[];

  // Loading
  isLoading: boolean;

  // ── Adaptive difficulty ────────────────────────────────────────────────────
  adaptiveDifficultyScore: number;          // raw cumulative score
  adaptiveDifficultyLevel: AdaptiveDifficultyLevel; // derived label

  // Reviews
  completedReviews: Set<string>;
  completeReview: (userId: string, topicId: string, score: number, xpEarned: number) => Promise<void>;

  // Daily challenge
  dailyChallengeCompletedDate: string | null;
  completeDailyChallenge: (userId: string, xpEarned: number) => Promise<void>;

  // Actions
  loadProgress: (userId: string) => Promise<void>;
  completeLesson: (
    userId: string,
    lessonId: string,
    xpEarned: number,
    mistakes: number,
    difficultyDelta: DifficultyDelta,
  ) => Promise<void>;
  addXP: (amount: number) => void;
  unlockAchievement: (userId: string, achievementId: string) => Promise<void>;
  checkAndUnlockAchievements: (userId: string) => Promise<void>;
  getTopicsWithProgress: () => Topic[];
  resetProgress: () => void;
}

// Apply completion/locked status to topics based on saved progress
function applyProgressToTopics(topics: Topic[], completedIds: Set<string>): Topic[] {
  return topics.map((topic) => {
    const lessons = topic.lessons.map((lesson, idx) => {
      const isCompleted = completedIds.has(lesson.id);
      const prevCompleted =
        idx === 0 ? true : completedIds.has(topic.lessons[idx - 1].id);
      return {
        ...lesson,
        is_completed: isCompleted,
        is_locked: !prevCompleted && !isCompleted,
      };
    });
    return { ...topic, lessons };
  });
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  totalXP: 0,
  currentLevel: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  lessonsCompleted: 0,
  completedLessonIds: new Set(),
  topics: TOPICS,
  unlockedAchievements: [],
  isLoading: false,
  adaptiveDifficultyScore: 0,
  adaptiveDifficultyLevel: "normal",
  completedReviews: new Set(),
  dailyChallengeCompletedDate: null,

  loadProgress: async (userId) => {
    set({ isLoading: true });
    try {
      // Fetch user stats from Firestore
      const userSnap = await userDoc(userId).get();
      const userData = userSnap.data() ?? {};

      // Fetch all completed progress docs
      const progressSnap = await progressCol(userId)
        .where("completed", "==", true)
        .get();

      // Fetch streak doc
      const streakSnap = await streakDoc(userId).get();
      const streakData = streakSnap.data() ?? {};

      // Fetch unlocked achievements
      const achSnap = await achievementsCol(userId).get();

      // Fetch completed reviews
      const reviewSnap = await reviewsCol(userId).get();
      const completedReviews = new Set<string>(reviewSnap.docs.map((d) => d.id));

      const completedIds = new Set<string>(
        progressSnap.docs.map((d) => d.id)
      );
      const totalXP: number = userData.total_xp ?? 0;
      const currentLevel = computeLevel(totalXP);

      const unlockedAchievements = achSnap.docs
        .map((d) => {
          const ach = ACHIEVEMENTS.find((a) => a.id === d.id);
          return ach
            ? { ...ach, unlocked: true, unlocked_at: d.data().unlocked_at }
            : null;
        })
        .filter(Boolean) as Achievement[];

      const adaptiveDifficultyScore: number = userData.adaptive_difficulty_score ?? 0;
      const dailyChallengeCompletedDate: string | null = userData.daily_challenge_completed_date ?? null;

      set({
        totalXP,
        currentLevel,
        currentStreak: streakData.current_streak ?? 0,
        longestStreak: streakData.longest_streak ?? 0,
        lastActivityDate: streakData.last_activity_date ?? null,
        lessonsCompleted: completedIds.size,
        completedLessonIds: completedIds,
        topics: applyProgressToTopics(TOPICS, completedIds),
        unlockedAchievements,
        adaptiveDifficultyScore,
        adaptiveDifficultyLevel: scoreToLevel(adaptiveDifficultyScore),
        completedReviews,
        dailyChallengeCompletedDate,
      });
    } catch {
      // Offline or guest — keep existing local state
    } finally {
      set({ isLoading: false });
    }
  },

  completeLesson: async (userId, lessonId, xpEarned, mistakes, difficultyDelta) => {
    const { completedLessonIds, totalXP, adaptiveDifficultyScore } = get();

    // Optimistic local update
    const newCompleted = new Set(completedLessonIds);
    newCompleted.add(lessonId);
    const newXP = totalXP + xpEarned;
    const newLevel = computeLevel(newXP);

    // Clamp cumulative difficulty score to its valid range
    const newDiffScore = clampDifficultyScore(adaptiveDifficultyScore + difficultyDelta);
    const newDiffLevel = scoreToLevel(newDiffScore);

    set({
      completedLessonIds: newCompleted,
      totalXP: newXP,
      currentLevel: newLevel,
      lessonsCompleted: newCompleted.size,
      topics: applyProgressToTopics(TOPICS, newCompleted),
      adaptiveDifficultyScore: newDiffScore,
      adaptiveDifficultyLevel: newDiffLevel,
    });

    // Skip Firestore writes for guests
    if (userId === "guest") return;

    const topic = TOPICS.find((t) => t.lessons.some((l) => l.id === lessonId));

    try {
      // Write progress doc (doc ID = lessonId for easy lookup)
      await progressCol(userId).doc(lessonId).set({
        lesson_id: lessonId,
        topic_id: topic?.id ?? "",
        completed: true,
        xp_earned: xpEarned,
        mistakes,
        difficulty_delta: difficultyDelta,
        completed_at: new Date().toISOString(),
      });

      // Update user XP, level, and adaptive difficulty score
      await userDoc(userId).set({
        total_xp: newXP,
        current_level: newLevel,
        adaptive_difficulty_score: newDiffScore,
      }, { merge: true });
    } catch {
      // Offline — local state already updated optimistically
    }

    // ── Streak logic ──────────────────────────────────────────────────────────
    const today = new Date().toISOString().split("T")[0];
    const streakSnap = await streakDoc(userId).get();
    const streakData = streakSnap.data() ?? {};
    const lastDate: string | null = streakData.last_activity_date ?? null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    const newStreak = computeStreak({
      lastDate,
      today,
      yesterday: yStr,
      currentStreak: streakData.current_streak ?? 0,
    });

    const longest = Math.max(newStreak, streakData.longest_streak ?? 0);

    await streakDoc(userId).set(
      { current_streak: newStreak, longest_streak: longest, last_activity_date: today },
      { merge: true }
    );

    set({ currentStreak: newStreak, longestStreak: longest, lastActivityDate: today });

    await get().checkAndUnlockAchievements(userId);
  },

  completeReview: async (userId, topicId, score, xpEarned) => {
    const { completedReviews, totalXP } = get();
    const newCompleted = new Set(completedReviews);
    newCompleted.add(topicId);
    const newXP = totalXP + xpEarned;
    set({ completedReviews: newCompleted, totalXP: newXP, currentLevel: computeLevel(newXP) });

    if (userId === "guest") return;
    await reviewsCol(userId).doc(topicId).set({
      topic_id: topicId,
      score,
      xp_earned: xpEarned,
      completed_at: new Date().toISOString(),
    });
    await userDoc(userId).update({ total_xp: newXP, current_level: computeLevel(newXP) });
  },

  completeDailyChallenge: async (userId, xpEarned) => {
    const { totalXP, unlockAchievement } = get();
    const today = new Date().toISOString().split("T")[0];
    const newXP = totalXP + xpEarned;
    set({ dailyChallengeCompletedDate: today, totalXP: newXP, currentLevel: computeLevel(newXP) });
    if (userId === "guest") return;
    await userDoc(userId).update({
      total_xp: newXP,
      current_level: computeLevel(newXP),
      daily_challenge_completed_date: today,
    });
    await unlockAchievement(userId, "ach_daily_challenge");
  },

  addXP: (amount) => {
    const { totalXP } = get();
    const newXP = totalXP + amount;
    set({ totalXP: newXP, currentLevel: computeLevel(newXP) });
  },

  unlockAchievement: async (userId, achievementId) => {
    const { unlockedAchievements } = get();
    if (unlockedAchievements.some((a) => a.id === achievementId)) return;

    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach) return;

    set({
      unlockedAchievements: [
        ...unlockedAchievements,
        { ...ach, unlocked: true, unlocked_at: new Date().toISOString() },
      ],
    });

    if (userId !== "guest") {
      // Doc ID = achievementId for easy lookup
      await achievementsCol(userId).doc(achievementId).set({
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      });
    }
  },

  checkAndUnlockAchievements: async (userId) => {
    const {
      lessonsCompleted,
      totalXP,
      currentStreak,
      completedLessonIds,
      completedReviews,
      unlockAchievement,
    } = get();

    const toUnlock = achievementsToUnlock({
      lessonsCompleted,
      currentStreak,
      totalXP,
      completedLessonIds,
      completedReviewsCount: completedReviews.size,
    });

    // unlockAchievement is idempotent, so unconditionally requesting the full
    // qualifying set is safe.
    for (const id of toUnlock) {
      await unlockAchievement(userId, id);
    }
  },

  getTopicsWithProgress: () => get().topics,

  resetProgress: () => {
    set({
      totalXP: 0,
      currentLevel: 1,
      currentStreak: 0,
      longestStreak: 0,
      lessonsCompleted: 0,
      completedLessonIds: new Set(),
      topics: TOPICS,
      unlockedAchievements: [],
    });
  },
}));
