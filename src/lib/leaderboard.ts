import { auth, firestore, leaderboardDoc } from "./firebase";
import { computeLevel } from "./progressMath";

// ─── Public leaderboard ───────────────────────────────────────────────────────
// The leaderboard reads leaderboard/{uid}, never users/{uid}, so other players
// only ever see a display name and XP — not emails or private profile fields.
//
// firestore.rules only lets an entry's XP rise by MAX_XP_PER_WRITE per write,
// at most once every LEADERBOARD_WRITE_INTERVAL_S seconds. Keep these in sync.

export const MAX_XP_PER_WRITE = 200;
export const LEADERBOARD_WRITE_INTERVAL_S = 10;
export const MAX_DISPLAY_NAME_LENGTH = 40;

/**
 * Move the user's public leaderboard entry toward their real XP.
 *
 * Each call climbs by at most MAX_XP_PER_WRITE, so an entry that fell behind
 * (offline play, a throttled write) catches up over later calls. Never throws:
 * a rejected write just means the next sync retries.
 */
export async function syncLeaderboard(uid: string, totalXP: number): Promise<void> {
  if (uid === "guest") return;
  try {
    const ref = leaderboardDoc(uid);
    const snap = await ref.get();
    const currentXP: number = snap.exists() ? snap.data()?.total_xp ?? 0 : 0;
    if (totalXP <= currentXP) return;

    const xp = Math.min(totalXP, currentXP + MAX_XP_PER_WRITE);
    const name = (auth().currentUser?.displayName ?? "").trim() || "Mathlete";

    await ref.set({
      display_name: name.slice(0, MAX_DISPLAY_NAME_LENGTH),
      total_xp: xp,
      current_level: computeLevel(xp),
      updated_at: firestore.FieldValue.serverTimestamp(),
    });
  } catch {
    // Offline or throttled — the next sync catches up
  }
}
