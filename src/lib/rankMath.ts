/**
 * Convert the number of users with strictly more XP into a 1-based rank.
 * Equal-XP users share the same rank.
 */
export function rankFromHigherScoreCount(higherScoreCount: number): number {
  return Math.max(1, higherScoreCount + 1);
}
