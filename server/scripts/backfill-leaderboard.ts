/**
 * One-off: copy every user's XP into the public leaderboard/{uid} collection.
 *
 * Run once, right after deploying the firestore.rules that make users/{uid}
 * owner-only. Without it, existing players start the new leaderboard at 0 and
 * the 200-XP-per-write rule makes them climb back slowly.
 *
 * Uses the Admin SDK (bypasses security rules). Needs a service-account key:
 *   Firebase console → Project settings → Service accounts → Generate new key
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json npx ts-node scripts/backfill-leaderboard.ts
 *
 * Safe to re-run: it only ever raises an entry, never lowers it.
 */

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const XP_PER_LEVEL = 500; // keep in sync with src/constants/theme.ts
const MAX_DISPLAY_NAME_LENGTH = 40;
const BATCH_SIZE = 400;

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function main() {
  const users = await db.collection("users").get();
  const existing = await db.collection("leaderboard").get();
  const existingXP = new Map(existing.docs.map((d) => [d.id, d.get("total_xp") ?? 0]));

  let batch = db.batch();
  let pending = 0;
  let written = 0;

  for (const user of users.docs) {
    const d = user.data();
    const xp = Math.max(0, Math.floor(Number(d.total_xp) || 0));
    if (xp === 0 || xp <= (existingXP.get(user.id) ?? 0)) continue;

    // Never fall back to the email — that is what this migration hides.
    const name = String(d.display_name ?? d.username ?? "").trim() || "Mathlete";

    batch.set(db.collection("leaderboard").doc(user.id), {
      display_name: name.slice(0, MAX_DISPLAY_NAME_LENGTH),
      total_xp: xp,
      current_level: Math.floor(xp / XP_PER_LEVEL) + 1,
      updated_at: FieldValue.serverTimestamp(),
    });
    pending++;
    written++;

    if (pending === BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  console.log(`Scanned ${users.size} users, wrote ${written} leaderboard entries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
