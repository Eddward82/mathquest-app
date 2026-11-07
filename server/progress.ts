/**
 * Server-owned progress: the free-lesson count and the public leaderboard.
 *
 * Clients can't write `started_lesson_ids` or `leaderboard/*` (firestore.rules),
 * so only this file can change them.
 *
 * Lessons ship inside the app and are completed on the device, so the server
 * can't prove anyone really finished one. What it can do is make cheating
 * pointless: leaderboard XP is limited to what the lessons this account was
 * allowed to start can award, and to a daily maximum. Someone forging progress
 * gets at most what an honest player of the same account could have earned.
 */

import type { App } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import catalog from "./xpCatalog.json";

export const FREE_LESSON_LIMIT = 5;
const WRITE_INTERVAL_MS = 10_000;
const MAX_DISPLAY_NAME_LENGTH = 40;
const XP_PER_LEVEL = 500; // keep in sync with src/constants/theme.ts
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_XP_PER_DAY = Number.parseInt(process.env.LEADERBOARD_MAX_XP_PER_DAY ?? "1000", 10);

const lessonXp = catalog.lessons as Record<string, number>;
const reviewTopics = new Set(catalog.reviewTopics);

export function isKnownLesson(lessonId: unknown): lessonId is string {
  return typeof lessonId === "string" && Object.prototype.hasOwnProperty.call(lessonXp, lessonId);
}

/**
 * `premium` is null when the subscription can't be checked. Lessons cost nothing
 * to serve, so a paying customer is never locked out by a RevenueCat outage.
 */
export function decideLessonStart(input: {
  lessonId: string;
  started: string[];
  legacyTotal: number;
  premium: boolean | null;
}): "already_started" | "record" | "limit_reached" {
  if (input.started.includes(input.lessonId)) return "already_started";
  const used = Math.max(input.started.length, input.legacyTotal);
  if (used < FREE_LESSON_LIMIT || input.premium !== false) return "record";
  return "limit_reached";
}

export function leaderboardXp(input: {
  claimedXp: number;
  startedLessonIds: string[];
  completedLessonIds: string[];
  reviewedTopicIds: string[];
  accountAgeMs: number;
  maxXpPerDay?: number;
}): number {
  const started = new Set(input.startedLessonIds);
  const days = Math.max(Math.floor(input.accountAgeMs / DAY_MS), 0) + 1;

  const fromLessons = [...new Set(input.completedLessonIds)]
    .filter((id) => started.has(id) && isKnownLesson(id))
    .reduce((sum, id) => sum + lessonXp[id], 0);
  const fromReviews =
    new Set(input.reviewedTopicIds.filter((id) => reviewTopics.has(id))).size * catalog.reviewXp;
  const fromChallenges = days * catalog.dailyChallengeMaxXp;

  const claimed = Number.isFinite(input.claimedXp) ? Math.floor(input.claimedXp) : 0;
  return Math.max(
    0,
    Math.min(
      claimed,
      fromLessons + fromReviews + fromChallenges,
      days * (input.maxXpPerDay ?? MAX_XP_PER_DAY)
    )
  );
}

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export function createProgressService(deps: {
  getApp: () => App;
  /** Resolves to null when the subscription can't be checked. */
  lookupPremium: (uid: string) => Promise<boolean | null>;
}) {
  const db = () => getFirestore(deps.getApp());

  async function startLesson(uid: string, lessonId: string) {
    const ref = db().doc(`users/${uid}`);
    const before = await ref.get();
    const count = Math.max(
      stringList(before.get("started_lesson_ids")).length,
      (before.get("lessons_started_total") as number) ?? 0
    );
    const premium = count >= FREE_LESSON_LIMIT ? await deps.lookupPremium(uid) : false;

    return db().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const started = stringList(snap.get("started_lesson_ids"));
      const legacyTotal = (snap.get("lessons_started_total") as number) ?? 0;
      const decision = decideLessonStart({ lessonId, started, legacyTotal, premium });

      if (decision === "record") {
        tx.set(ref, { started_lesson_ids: FieldValue.arrayUnion(lessonId) }, { merge: true });
        started.push(lessonId);
      }
      return {
        allowed: decision !== "limit_reached",
        startedLessonIds: started,
        lessonsStartedTotal: Math.max(started.length, legacyTotal),
      };
    });
  }

  /** Raises the account's public entry to what its progress supports. Never lowers it. */
  async function syncLeaderboard(uid: string, account: { displayName?: string; createdAtMs: number }) {
    const entryRef = db().doc(`leaderboard/${uid}`);
    const entry = await entryRef.get();
    const currentXp = (entry.get("total_xp") as number) ?? 0;
    const updatedAt = entry.get("updated_at") as Timestamp | undefined;

    const waitMs = updatedAt ? updatedAt.toMillis() + WRITE_INTERVAL_MS - Date.now() : 0;
    if (waitMs > 0) return { totalXp: currentXp, retryAfterMs: waitMs };

    const userRef = db().doc(`users/${uid}`);
    const [user, progress, reviews] = await Promise.all([
      userRef.get(),
      userRef.collection("progress").where("completed", "==", true).select().get(),
      userRef.collection("reviews").select().get(),
    ]);

    const xp = leaderboardXp({
      claimedXp: (user.get("total_xp") as number) ?? 0,
      startedLessonIds: stringList(user.get("started_lesson_ids")),
      completedLessonIds: progress.docs.map((doc) => doc.id),
      reviewedTopicIds: reviews.docs.map((doc) => doc.id),
      accountAgeMs: Date.now() - account.createdAtMs,
    });
    if (xp <= currentXp) return { totalXp: currentXp, retryAfterMs: 0 };

    await entryRef.set({
      display_name: (account.displayName?.trim() || "Mathlete").slice(0, MAX_DISPLAY_NAME_LENGTH),
      total_xp: xp,
      current_level: Math.floor(xp / XP_PER_LEVEL) + 1,
      updated_at: FieldValue.serverTimestamp(),
    });
    return { totalXp: xp, retryAfterMs: 0 };
  }

  return { startLesson, syncLeaderboard };
}
