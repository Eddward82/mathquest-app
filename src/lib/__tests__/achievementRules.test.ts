import { achievementsToUnlock, AchievementStats } from "../achievementRules";
import { TOPICS } from "../../data/lessons";

const emptyStats: AchievementStats = {
  lessonsCompleted: 0,
  currentStreak: 0,
  totalXP: 0,
  completedLessonIds: new Set<string>(),
  completedReviewsCount: 0,
};

describe("achievementsToUnlock — thresholds", () => {
  it("unlocks nothing for a brand new user", () => {
    expect(achievementsToUnlock(emptyStats)).toEqual([]);
  });

  it("unlocks the first-lesson achievement after one lesson", () => {
    const result = achievementsToUnlock({ ...emptyStats, lessonsCompleted: 1 });
    expect(result).toContain("ach_first_lesson");
    expect(result).not.toContain("ach_lessons_25");
  });

  it("unlocks lower XP tiers when a higher tier is reached", () => {
    const result = achievementsToUnlock({ ...emptyStats, totalXP: 1200 });
    expect(result).toEqual(
      expect.arrayContaining(["ach_xp_100", "ach_xp_500", "ach_xp_1000"])
    );
    expect(result).not.toContain("ach_xp_2500");
  });

  it("unlocks streak achievements at the boundary", () => {
    expect(achievementsToUnlock({ ...emptyStats, currentStreak: 7 })).toEqual(
      expect.arrayContaining(["ach_streak_3", "ach_streak_7"])
    );
  });

  it("unlocks the review achievement after one review", () => {
    expect(achievementsToUnlock({ ...emptyStats, completedReviewsCount: 1 })).toContain(
      "ach_review_first"
    );
  });
});

describe("achievementsToUnlock — topic completion", () => {
  const arithmetic = TOPICS.find((t) => t.id === "topic_arithmetic")!;

  it("does not unlock the topic badge when only some lessons are done", () => {
    const partial = new Set(arithmetic.lessons.slice(0, 1).map((l) => l.id));
    expect(achievementsToUnlock({ ...emptyStats, completedLessonIds: partial })).not.toContain(
      "ach_arithmetic"
    );
  });

  it("unlocks the topic badge once every lesson in the topic is complete", () => {
    const all = new Set(arithmetic.lessons.map((l) => l.id));
    expect(achievementsToUnlock({ ...emptyStats, completedLessonIds: all })).toContain(
      "ach_arithmetic"
    );
  });
});
