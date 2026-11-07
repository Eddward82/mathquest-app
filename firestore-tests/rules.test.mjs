// Security-rules tests. Run: cd firestore-tests && npm install && npm test
// (needs Java 11+; downloads the Firestore emulator on first run).
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";

const env = await initializeTestEnvironment({
  projectId: "demo-mathquest",
  firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 },
});

let failures = 0;
async function check(name, p) {
  try { await p; console.log("PASS", name); }
  catch (e) { failures++; console.log("FAIL", name, "-", e.message); }
}

const entry = (xp, extra = {}) => ({
  display_name: "Ada", total_xp: xp, current_level: Math.floor(xp / 500) + 1,
  updated_at: serverTimestamp(), ...extra,
});

// Seed: Bob's profile and an old leaderboard entry for Alice at 1000 XP.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "users/bob"), { email: "bob@example.com", total_xp: 50 });
  await setDoc(doc(db, "users/alice"), { email: "alice@example.com", total_xp: 1000 });
  await setDoc(doc(db, "users/alice/progress/l1"), { completed: true });
  await setDoc(doc(db, "leaderboard/alice"), {
    display_name: "Ada", total_xp: 1000, current_level: 3,
    updated_at: Timestamp.fromMillis(Date.now() - 60_000),
  });
});

const alice = env.authenticatedContext("alice").firestore();
const bob = env.authenticatedContext("bob").firestore();
const anon = env.unauthenticatedContext().firestore();

// Item 2 — profiles (with emails) are private
await check("owner reads own profile", assertSucceeds(getDoc(doc(alice, "users/alice"))));
await check("other user CANNOT read profile/email", assertFails(getDoc(doc(alice, "users/bob"))));
await check("other user CANNOT list users", assertFails(getDocs(collection(alice, "users"))));
await check("signed-in user reads leaderboard", assertSucceeds(getDocs(query(collection(bob, "leaderboard"), orderBy("total_xp", "desc")))));
await check("signed-out user CANNOT read leaderboard", assertFails(getDocs(collection(anon, "leaderboard"))));

// Item 3 — only the server writes the leaderboard
await check("raising own XP REJECTED", assertFails(setDoc(doc(alice, "leaderboard/alice"), entry(1200))));
await check("lowering own XP REJECTED", assertFails(setDoc(doc(alice, "leaderboard/alice"), entry(1100))));
await check("writing someone else's entry REJECTED", assertFails(setDoc(doc(bob, "leaderboard/alice"), entry(1300))));
await check("creating own entry REJECTED", assertFails(setDoc(doc(bob, "leaderboard/bob"), entry(150))));

// Item 1 — owner can delete everything account deletion touches
await check("owner deletes progress doc", assertSucceeds(deleteDoc(doc(alice, "users/alice/progress/l1"))));
await check("owner deletes leaderboard entry", assertSucceeds(deleteDoc(doc(alice, "leaderboard/alice"))));
await check("owner deletes profile", assertSucceeds(deleteDoc(doc(alice, "users/alice"))));
await check("other user CANNOT delete leaderboard entry", assertFails(deleteDoc(doc(alice, "leaderboard/bob"))));

// Item 6 — only the server changes the free-lesson count
await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/bob"), {
  email: "bob@example.com", started_lesson_ids: ["l1", "l2"], lessons_started_total: 2,
}));
await check("adding a started lesson REJECTED", assertFails(setDoc(doc(bob, "users/bob"), { started_lesson_ids: ["l1", "l2", "l3"] }, { merge: true })));
await check("removing started lessons REJECTED", assertFails(setDoc(doc(bob, "users/bob"), { started_lesson_ids: ["l1"] }, { merge: true })));
await check("lowering legacy total REJECTED", assertFails(setDoc(doc(bob, "users/bob"), { lessons_started_total: 0 }, { merge: true })));
await check("new profile with started lessons REJECTED", assertFails(setDoc(doc(env.authenticatedContext("ida").firestore(), "users/ida"), { email: "i@example.com", started_lesson_ids: [] })));
await check("unrelated profile update OK, keeping the count", assertSucceeds(setDoc(doc(bob, "users/bob"), { skill_level: "advanced" }, { merge: true })));

// Existing protections still hold
await check("premium flag write still REJECTED", assertFails(setDoc(doc(bob, "users/bob"), { is_premium: true }, { merge: true })));

// Bot abuse — every write the real app makes still works...
const erin = env.authenticatedContext("erin").firestore();
const now = new Date().toISOString();
await check("signup profile OK", assertSucceeds(setDoc(doc(erin, "users/erin"), {
  id: "erin", email: "erin@example.com", username: "erin", skill_level: "beginner",
  created_at: now, display_name: "erin", total_xp: 0, current_level: 1,
})));
await check("onboarding update OK", assertSucceeds(setDoc(doc(erin, "users/erin"), {
  goal: "exam_prep", daily_target_minutes: 15, focus_topics: ["algebra"], onboarding_completed: true,
}, { merge: true })));
await check("lesson XP update OK", assertSucceeds(setDoc(doc(erin, "users/erin"), {
  total_xp: 20, current_level: 1, adaptive_difficulty_score: 0.5,
}, { merge: true })));
await check("daily challenge update OK", assertSucceeds(setDoc(doc(erin, "users/erin"), {
  total_xp: 40, current_level: 1, daily_challenge_completed_date: "2026-11-07",
}, { merge: true })));
await check("new streak doc OK", assertSucceeds(setDoc(doc(erin, "users/erin/streaks/data"), {
  current_streak: 0, longest_streak: 0, last_activity_date: null,
})));
await check("streak update OK", assertSucceeds(setDoc(doc(erin, "users/erin/streaks/data"), {
  current_streak: 1, longest_streak: 1, last_activity_date: "2026-11-07",
}, { merge: true })));
await check("progress doc OK", assertSucceeds(setDoc(doc(erin, "users/erin/progress/lesson_arith_1"), {
  lesson_id: "lesson_arith_1", topic_id: "topic_arithmetic", completed: true, xp_earned: 20,
  mistakes: 1, difficulty_delta: 0, completed_at: now,
})));
await check("redoing a lesson OK", assertSucceeds(setDoc(doc(erin, "users/erin/progress/lesson_arith_1"), {
  lesson_id: "lesson_arith_1", topic_id: "topic_arithmetic", completed: true, xp_earned: 25,
  mistakes: 0, difficulty_delta: 1, completed_at: now,
})));
await check("achievement doc OK", assertSucceeds(setDoc(doc(erin, "users/erin/achievements/ach_first_lesson"), {
  achievement_id: "ach_first_lesson", unlocked_at: now,
})));
await check("review doc OK", assertSucceeds(setDoc(doc(erin, "users/erin/reviews/topic_arithmetic"), {
  topic_id: "topic_arithmetic", score: 90, xp_earned: 30, completed_at: now,
})));
await check("account deletion clears a subcollection doc", assertSucceeds(deleteDoc(doc(erin, "users/erin/reviews/topic_arithmetic"))));

// ...and existing documents holding a legacy field can still be updated.
await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/frank"), {
  email: "frank@example.com", legacy_field: "kept",
}));
const frank = env.authenticatedContext("frank").firestore();
await check("legacy profile can still update known fields", assertSucceeds(setDoc(doc(frank, "users/frank"), { skill_level: "advanced" }, { merge: true })));

// ...while junk data is refused.
const big = "x".repeat(5000);
await check("unknown subcollection REJECTED", assertFails(setDoc(doc(erin, "users/erin/junk/1"), { a: 1 })));
await check("extra field on progress REJECTED", assertFails(setDoc(doc(erin, "users/erin/progress/l9"), { lesson_id: "l9", junk: big })));
await check("progress id mismatch REJECTED", assertFails(setDoc(doc(erin, "users/erin/progress/l9"), { lesson_id: "other" })));
await check("huge progress field REJECTED", assertFails(setDoc(doc(erin, "users/erin/progress/l9"), { lesson_id: "l9", topic_id: big })));
await check("oversized document id REJECTED", assertFails(setDoc(doc(erin, `users/erin/progress/${"x".repeat(65)}`), { lesson_id: "x".repeat(65) })));
await check("second streak doc REJECTED", assertFails(setDoc(doc(erin, "users/erin/streaks/other"), { current_streak: 1 })));
await check("unknown profile field REJECTED", assertFails(setDoc(doc(erin, "users/erin"), { junk: big }, { merge: true })));
await check("huge username REJECTED", assertFails(setDoc(doc(erin, "users/erin"), { username: big }, { merge: true })));
await check("too many started lessons REJECTED", assertFails(setDoc(doc(erin, "users/erin"), {
  started_lesson_ids: Array.from({ length: 501 }, (_, i) => `l${i}`),
}, { merge: true })));
await check("new profile with unknown field REJECTED", assertFails(setDoc(doc(env.authenticatedContext("gina").firestore(), "users/gina"), { junk: big })));
await check("new profile with premium flag REJECTED", assertFails(setDoc(doc(env.authenticatedContext("hal").firestore(), "users/hal"), { email: "h@example.com", is_premium: true })));
await check("usage counters unreadable by clients", assertFails(getDoc(doc(erin, "aiUsage/global_2026-11-07"))));
await check("usage counters unwritable by clients", assertFails(setDoc(doc(erin, "aiUsage/uid_erin_2026-11-07"), { count: 0 })));

await env.cleanup();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
