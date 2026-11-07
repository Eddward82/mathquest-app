import { test } from "node:test";
import assert from "node:assert/strict";
import catalog from "./xpCatalog.json";
import { decideLessonStart, FREE_LESSON_LIMIT, isKnownLesson, leaderboardXp } from "./progress";

const DAY_MS = 24 * 60 * 60 * 1000;
const lessons = Object.entries(catalog.lessons as Record<string, number>);
const [firstId, firstXp] = lessons[0];
const allIds = lessons.map(([id]) => id);
const fiveIds = allIds.slice(0, FREE_LESSON_LIMIT);

const decide = (started: string[], premium: boolean | null, lessonId = "new", legacyTotal = 0) =>
  decideLessonStart({ lessonId, started, legacyTotal, premium });

test("a free account can start the free allowance, then is refused", () => {
  assert.equal(decide(fiveIds.slice(0, 4), false), "record");
  assert.equal(decide(fiveIds, false), "limit_reached");
});

test("reopening a started lesson never uses or needs an allowance", () => {
  assert.equal(decide(fiveIds, false, fiveIds[0]), "already_started");
});

test("the legacy counter still counts toward the limit", () => {
  assert.equal(decide([], false, "new", FREE_LESSON_LIMIT), "limit_reached");
});

test("premium has no limit, and an unknown subscription isn't locked out", () => {
  assert.equal(decide(fiveIds, true), "record");
  assert.equal(decide(fiveIds, null), "record");
});

test("only real lesson ids are accepted", () => {
  assert.equal(isKnownLesson(firstId), true);
  assert.equal(isKnownLesson("made_up"), false);
  assert.equal(isKnownLesson("constructor"), false);
  assert.equal(isKnownLesson(42), false);
});

const base = {
  claimedXp: 0,
  startedLessonIds: [] as string[],
  completedLessonIds: [] as string[],
  reviewedTopicIds: [] as string[],
  accountAgeMs: 0,
};

test("an honest player gets the XP they earned", () => {
  const xp = leaderboardXp({ ...base, claimedXp: firstXp, startedLessonIds: [firstId], completedLessonIds: [firstId] });
  assert.equal(xp, firstXp);
});

test("a huge claimed XP is limited to what the progress supports", () => {
  const xp = leaderboardXp({ ...base, claimedXp: 999_999, startedLessonIds: [firstId], completedLessonIds: [firstId] });
  assert.equal(xp, firstXp + catalog.dailyChallengeMaxXp);
});

test("forged completions of lessons never started earn nothing", () => {
  const xp = leaderboardXp({ ...base, claimedXp: 999_999, startedLessonIds: fiveIds, completedLessonIds: allIds });
  const free = fiveIds.reduce((sum, id) => sum + (catalog.lessons as Record<string, number>)[id], 0);
  assert.equal(xp, free + catalog.dailyChallengeMaxXp);
});

test("made-up lessons and review topics earn nothing, and duplicates count once", () => {
  const xp = leaderboardXp({
    ...base,
    claimedXp: 999_999,
    startedLessonIds: ["fake", firstId],
    completedLessonIds: ["fake", firstId, firstId],
    reviewedTopicIds: ["fake_topic"],
  });
  assert.equal(xp, firstXp + catalog.dailyChallengeMaxXp);
});

test("real reviews count once per topic", () => {
  const topic = catalog.reviewTopics[0];
  const xp = leaderboardXp({ ...base, claimedXp: 999_999, reviewedTopicIds: [topic, topic] });
  assert.equal(xp, catalog.reviewXp + catalog.dailyChallengeMaxXp);
});

test("a new account can't exceed the daily maximum, however much it forges", () => {
  const forged = { ...base, claimedXp: 999_999, startedLessonIds: allIds, completedLessonIds: allIds, reviewedTopicIds: catalog.reviewTopics };
  assert.equal(leaderboardXp({ ...forged, maxXpPerDay: 300 }), 300);
  assert.equal(leaderboardXp({ ...forged, maxXpPerDay: 300, accountAgeMs: 2 * DAY_MS }), 900);
});

test("bad claimed values are treated as nothing", () => {
  assert.equal(leaderboardXp({ ...base, claimedXp: Number.NaN }), 0);
  assert.equal(leaderboardXp({ ...base, claimedXp: -50 }), 0);
});
