import { leaderboardCooldownMs, nextLeaderboardXP } from "../leaderboardMath";

describe("leaderboard sync math", () => {
  it("moves a stale 41 XP entry to the new 191 XP total", () => {
    expect(nextLeaderboardXP(41, 191, 200)).toBe(191);
  });

  it("limits a single catch-up write to the security-rule maximum", () => {
    expect(nextLeaderboardXP(41, 500, 200)).toBe(241);
  });

  it("waits until the ten-second write cooldown has elapsed", () => {
    expect(leaderboardCooldownMs(1_000, 9_000, 10_000)).toBe(3_000);
  });

  it("does not delay an update when the cooldown has elapsed", () => {
    expect(leaderboardCooldownMs(1_000, 12_000, 10_000)).toBe(0);
  });
});
