import { rankFromHigherScoreCount } from "../rankMath";

describe("rankFromHigherScoreCount", () => {
  it("returns the first rank when nobody has more XP", () => {
    expect(rankFromHigherScoreCount(0)).toBe(1);
  });

  it("supports users outside the visible top-50 list", () => {
    expect(rankFromHigherScoreCount(50)).toBe(51);
  });

  it("gives tied XP users the same rank", () => {
    expect(rankFromHigherScoreCount(40)).toBe(41);
  });
});
