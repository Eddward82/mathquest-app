import { apiPost } from "./api";

// ─── Public leaderboard ───────────────────────────────────────────────────────
// The leaderboard reads leaderboard/{uid}, never users/{uid}, so other players
// only ever see a display name and XP — not emails or private profile fields.
//
// Only the server writes these entries (firestore.rules), working out the XP
// from the user's saved progress. See server/progress.ts.

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 11_000;

let retryTimer: ReturnType<typeof setTimeout> | undefined;

function retryLater(uid: string, attempt: number, delayMs: number): void {
  if (attempt >= MAX_RETRIES) return;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void syncLeaderboard(uid, attempt + 1), delayMs);
}

/**
 * Asks the server to bring the user's public entry up to date. Call it after
 * saving XP. Never throws: if it fails, the next sync catches up.
 */
export async function syncLeaderboard(uid: string, attempt = 0): Promise<void> {
  if (uid === "guest") return;
  try {
    const { status, data } = await apiPost<{ retryAfterMs: number }>("/api/progress/leaderboard-sync");
    if (data && data.retryAfterMs > 0) retryLater(uid, attempt, data.retryAfterMs + 1_000);
    else if (status >= 500) retryLater(uid, attempt, RETRY_DELAY_MS);
  } catch {
    retryLater(uid, attempt, RETRY_DELAY_MS);
  }
}
