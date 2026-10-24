export const LEADERBOARD_RETRY_BUFFER_MS = 1_000;

export function nextLeaderboardXP(
  currentXP: number,
  targetXP: number,
  maxXPPerWrite: number,
): number {
  return Math.min(targetXP, currentXP + maxXPPerWrite);
}

export function leaderboardCooldownMs(
  updatedAtMs: number | null,
  nowMs: number,
  intervalMs: number,
): number {
  if (updatedAtMs === null) return 0;

  return Math.max(
    0,
    updatedAtMs + intervalMs + LEADERBOARD_RETRY_BUFFER_MS - nowMs,
  );
}
