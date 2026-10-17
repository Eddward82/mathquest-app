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

// Item 3 — XP cheating limits
await check("+200 XP after cooldown OK", assertSucceeds(setDoc(doc(alice, "leaderboard/alice"), entry(1200))));
await check("second write within 10s REJECTED", assertFails(setDoc(doc(alice, "leaderboard/alice"), entry(1250))));
await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "leaderboard/alice"), {
  display_name: "Ada", total_xp: 1200, current_level: 3, updated_at: Timestamp.fromMillis(Date.now() - 60_000),
}));
await check("+201 XP REJECTED", assertFails(setDoc(doc(alice, "leaderboard/alice"), entry(1401))));
await check("XP decrease REJECTED", assertFails(setDoc(doc(alice, "leaderboard/alice"), entry(1100))));
await check("wrong level REJECTED", assertFails(setDoc(doc(alice, "leaderboard/alice"), entry(1300, { current_level: 50 }))));
await check("extra field REJECTED", assertFails(setDoc(doc(alice, "leaderboard/alice"), entry(1300, { email: "x" }))));
await check("client-chosen timestamp REJECTED", assertFails(setDoc(doc(alice, "leaderboard/alice"), entry(1300, { updated_at: Timestamp.fromMillis(0) }))));
await check("writing someone else's entry REJECTED", assertFails(setDoc(doc(bob, "leaderboard/alice"), entry(1300))));
await check("new entry at 150 XP OK", assertSucceeds(setDoc(doc(bob, "leaderboard/bob"), entry(150))));
await check("new entry at 99999 XP REJECTED", assertFails(setDoc(doc(env.authenticatedContext("carol").firestore(), "leaderboard/carol"), entry(99999))));
await check("float XP REJECTED", assertFails(setDoc(doc(env.authenticatedContext("dan").firestore(), "leaderboard/dan"), entry(10.5, { current_level: 1 }))));

// Item 1 — owner can delete everything account deletion touches
await check("owner deletes progress doc", assertSucceeds(deleteDoc(doc(alice, "users/alice/progress/l1"))));
await check("owner deletes leaderboard entry", assertSucceeds(deleteDoc(doc(alice, "leaderboard/alice"))));
await check("owner deletes profile", assertSucceeds(deleteDoc(doc(alice, "users/alice"))));
await check("other user CANNOT delete leaderboard entry", assertFails(deleteDoc(doc(alice, "leaderboard/bob"))));

// Item 6 — started-lesson list may only grow
await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/bob"), {
  email: "bob@example.com", started_lesson_ids: ["l1", "l2"], lessons_started_total: 2,
}));
await check("adding a started lesson OK", assertSucceeds(setDoc(doc(bob, "users/bob"), { started_lesson_ids: ["l1", "l2", "l3"] }, { merge: true })));
await check("removing started lessons REJECTED", assertFails(setDoc(doc(bob, "users/bob"), { started_lesson_ids: ["l1"] }, { merge: true })));
await check("lowering legacy total REJECTED", assertFails(setDoc(doc(bob, "users/bob"), { lessons_started_total: 0 }, { merge: true })));
await check("unrelated profile update OK", assertSucceeds(setDoc(doc(bob, "users/bob"), { skill_level: "advanced" }, { merge: true })));

// Existing protections still hold
await check("premium flag write still REJECTED", assertFails(setDoc(doc(bob, "users/bob"), { is_premium: true }, { merge: true })));

await env.cleanup();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
