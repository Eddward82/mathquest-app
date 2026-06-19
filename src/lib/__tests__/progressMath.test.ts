import {
  computeLevel,
  scoreToLevel,
  clampDifficultyScore,
  computeStreak,
  DIFFICULTY_SCORE_MIN,
  DIFFICULTY_SCORE_MAX,
} from "../progressMath";
import { XP_PER_LEVEL } from "../../constants/theme";

describe("computeLevel", () => {
  it("starts at level 1 with no XP", () => {
    expect(computeLevel(0)).toBe(1);
  });

  it("stays level 1 below the per-level threshold", () => {
    expect(computeLevel(XP_PER_LEVEL - 1)).toBe(1);
  });

  it("advances a level at each XP_PER_LEVEL boundary", () => {
    expect(computeLevel(XP_PER_LEVEL)).toBe(2);
    expect(computeLevel(XP_PER_LEVEL * 3)).toBe(4);
  });
});

describe("scoreToLevel", () => {
  it("maps high scores to harder", () => {
    expect(scoreToLevel(2)).toBe("harder");
    expect(scoreToLevel(5)).toBe("harder");
  });

  it("maps low scores to easier", () => {
    expect(scoreToLevel(-2)).toBe("easier");
    expect(scoreToLevel(-5)).toBe("easier");
  });

  it("maps the middle band to normal", () => {
    expect(scoreToLevel(0)).toBe("normal");
    expect(scoreToLevel(1)).toBe("normal");
    expect(scoreToLevel(-1)).toBe("normal");
  });
});

describe("clampDifficultyScore", () => {
  it("clamps to the configured range", () => {
    expect(clampDifficultyScore(99)).toBe(DIFFICULTY_SCORE_MAX);
    expect(clampDifficultyScore(-99)).toBe(DIFFICULTY_SCORE_MIN);
  });

  it("leaves in-range values untouched", () => {
    expect(clampDifficultyScore(3)).toBe(3);
    expect(clampDifficultyScore(0)).toBe(0);
  });
});

describe("computeStreak", () => {
  const base = { today: "2026-06-19", yesterday: "2026-06-18" };

  it("returns 1 for a first-ever activity", () => {
    expect(computeStreak({ ...base, lastDate: null, currentStreak: 0 })).toBe(1);
  });

  it("increments when the last activity was yesterday", () => {
    expect(computeStreak({ ...base, lastDate: "2026-06-18", currentStreak: 4 })).toBe(5);
  });

  it("keeps the streak unchanged when already active today", () => {
    expect(computeStreak({ ...base, lastDate: "2026-06-19", currentStreak: 4 })).toBe(4);
  });

  it("treats a same-day activity with no prior count as 1", () => {
    expect(computeStreak({ ...base, lastDate: "2026-06-19", currentStreak: 0 })).toBe(1);
  });

  it("resets to 1 when a day was missed", () => {
    expect(computeStreak({ ...base, lastDate: "2026-06-10", currentStreak: 9 })).toBe(1);
  });
});
