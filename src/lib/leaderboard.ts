import { auth, firestore, leaderboardDoc } from "./firebase";
import { leaderboardCooldownMs, nextLeaderboardXP } from "./leaderboardMath";
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

type RetryState = { timer: ReturnType<typeof setTimeout>; totalXP: number };
const pendingRetries = new Map<string, RetryState>();

function scheduleLeaderboardRetry(uid: string, totalXP: number, delayMs: number): void {
  const existing = pendingRetries.get(uid);
  if (existing) clearTimeout(existing.timer);

  const targetXP = Math.max(totalXP, existing?.totalXP ?? 0);
  const timer = setTimeout(() => {
    pendingRetries.delete(uid);
    void syncLeaderboard(uid, targetXP);
  }, Math.max(delayMs, 0));

  pendingRetries.set(uid, { timer, totalXP: targetXP });
}

function timestampMillis(value: unknown): number | null {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;

}
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
    const data = snap.exists() ? snap.data() ?? {} : {};
    const currentXP: number = data.total_xp ?? 0;
    if (totalXP <= currentXP) return;
    const cooldownMs = leaderboardCooldownMs(
      timestampMillis(data.updated_at),
      Date.now(),
      LEADERBOARD_WRITE_INTERVAL_S * 1000,
    );
    if (cooldownMs > 0) {
      scheduleLeaderboardRetry(uid, totalXP, cooldownMs);
      return;
    }

    const xp = nextLeaderboardXP(currentXP, totalXP, MAX_XP_PER_WRITE);
    const name = (auth().currentUser?.displayName ?? "").trim() || "Mathlete";

    await ref.set({
      display_name: name.slice(0, MAX_DISPLAY_NAME_LENGTH),
      total_xp: xp,
      current_level: computeLevel(xp),
      updated_at: firestore.FieldValue.serverTimestamp(),
    });
    if (xp < totalXP) {
      scheduleLeaderboardRetry(
        uid,
        totalXP,
        LEADERBOARD_WRITE_INTERVAL_S * 1000 + 1_000,
      );
    }
  } catch {
    // Offline or throttled — the next sync catches up
    scheduleLeaderboardRetry(
      uid,
      totalXP,
      LEADERBOARD_WRITE_INTERVAL_S * 1000 + 1_000,
    );
  }
}
