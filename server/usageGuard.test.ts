import { test } from "node:test";
import assert from "node:assert/strict";
import { createUsageGuard, ipSubject, Account, Counter, GuardConfig, GuardDeps } from "./usageGuard";

const NOW = Date.parse("2026-11-06T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const OLD: Account = { createdAtMs: NOW - 30 * DAY_MS, emailVerified: true, disabled: false };

const config: GuardConfig = {
  limits: { new: 2, free: 4, premium: 8 },
  perIpDailyLimit: 10,
  globalDailyLimit: 20,
  newAccountMs: DAY_MS,
  fallbackDailyLimit: 6,
  fallbackPerUser: 2,
  fallbackPerIp: 3,
  enforce: true,
};

function setup(overrides: Partial<GuardDeps> = {}, cfg: Partial<GuardConfig> = {}) {
  const counts = new Map<string, number>();
  const alerts: string[] = [];
  let global = 0;
  const store = {
    failing: false,
    async readGlobal() {
      if (store.failing) throw new Error("firestore down");
      return global;
    },
    async incrementGlobal() {
      global++;
    },
    async take(counters: Counter[]) {
      if (store.failing) throw new Error("firestore down");
      const full = counters.find((c) => (counts.get(c.id) ?? 0) >= c.limit);
      if (full) return full;
      counters.forEach((c) => counts.set(c.id, (counts.get(c.id) ?? 0) + 1));
      return null;
    },
  };
  const guard = createUsageGuard({ ...config, ...cfg }, {
    store,
    findAccount: async () => OLD,
    hasPremium: async () => false,
    alert: (text) => alerts.push(text),
    now: () => NOW,
    ...overrides,
  });
  return { guard, store, counts, alerts, globalCalls: () => global };
}

async function callsAllowed(guard: { reserve: Function }, request: { uid?: string; ip?: string }, attempts: number) {
  let allowed = 0;
  for (let i = 0; i < attempts; i++) {
    if ((await guard.reserve(request)).ok) allowed++;
  }
  return allowed;
}

test("a deleted account gets no calls", async () => {
  const { guard, counts } = setup({ findAccount: async () => null });
  const decision = await guard.reserve({ uid: "gone", ip: "1.1.1.1" });
  assert.deepEqual([decision.ok, !decision.ok && decision.status], [false, 401]);
  assert.equal(counts.size, 0);
});

test("a disabled account gets no calls", async () => {
  const { guard } = setup({ findAccount: async () => ({ ...OLD, disabled: true }) });
  const decision = await guard.reserve({ uid: "banned", ip: "1.1.1.1" });
  assert.equal(!decision.ok && decision.status, 401);
});

test("an unverified account is refused until it verifies, with no delay from caching", async () => {
  let verified = false;
  const { guard } = setup({ findAccount: async () => ({ ...OLD, emailVerified: verified }) });
  const first = await guard.reserve({ uid: "u", ip: "1.1.1.1" });
  assert.equal(!first.ok && first.code, "email_unverified");
  verified = true;
  assert.equal((await guard.reserve({ uid: "u", ip: "1.1.1.1" })).ok, true);
});

test("daily caps follow the tier", async () => {
  const fresh = setup({ findAccount: async () => ({ ...OLD, createdAtMs: NOW - 1000 }) });
  assert.equal(await callsAllowed(fresh.guard, { uid: "u", ip: "1.1.1.1" }, 5), 2);
  const free = setup();
  assert.equal(await callsAllowed(free.guard, { uid: "u", ip: "1.1.1.1" }, 6), 4);
  const premium = setup({ hasPremium: async () => true });
  assert.equal(await callsAllowed(premium.guard, { uid: "u", ip: "1.1.1.1" }, 9), 8);
});

test("many accounts on one IP share a daily cap", async () => {
  const { guard } = setup();
  let allowed = 0;
  let last;
  for (let i = 0; i < 15; i++) {
    last = await guard.reserve({ uid: `bot${i}`, ip: "6.6.6.6" });
    if (last.ok) allowed++;
  }
  assert.equal(allowed, 10);
  assert.equal(last && !last.ok && last.code, "network_limit");
  assert.equal((await guard.reserve({ uid: "real", ip: "7.7.7.7" })).ok, true);
});

test("a refused call uses up none of its other counters", async () => {
  const { guard, counts } = setup();
  await callsAllowed(guard, { uid: "u", ip: "1.1.1.1" }, 6);
  const ipCounter = [...counts].find(([id]) => id.startsWith("ipall_"));
  assert.equal(ipCounter?.[1], 4);
});

test("the global cap stops everyone and alerts", async () => {
  const { guard, alerts } = setup({}, { perIpDailyLimit: 1000, limits: { new: 2, free: 1000, premium: 8 } });
  const allowed = await callsAllowed(guard, { uid: "u", ip: "1.1.1.1" }, 25);
  assert.equal(allowed, 20);
  assert.equal(alerts.length, 2);
  assert.match(alerts[1], /PAUSED/);
});

test("an account lookup outage still counts calls, at the lowest tier", async () => {
  const { guard, globalCalls } = setup({
    findAccount: async () => {
      throw new Error("auth down");
    },
  });
  assert.equal(await callsAllowed(guard, { uid: "u", ip: "1.1.1.1" }, 5), 2);
  assert.equal(globalCalls(), 2);
});

test("a Firestore outage applies the per-user fallback limit and alerts once", async () => {
  const { guard, store, alerts } = setup();
  store.failing = true;
  assert.equal(await callsAllowed(guard, { uid: "u", ip: "1.1.1.1" }, 5), 2);
  assert.equal(alerts.length, 1);
  assert.match(alerts[0], /fallback/);
});

test("a Firestore outage applies the per-IP fallback limit across accounts", async () => {
  const { guard, store } = setup();
  store.failing = true;
  let allowed = 0;
  for (let i = 0; i < 6; i++) {
    if ((await guard.reserve({ uid: `bot${i}`, ip: "6.6.6.6" })).ok) allowed++;
  }
  assert.equal(allowed, 3);
});

test("a Firestore outage applies the total fallback limit across IPs", async () => {
  const { guard, store } = setup();
  store.failing = true;
  let allowed = 0;
  for (let i = 0; i < 12; i++) {
    if ((await guard.reserve({ uid: `bot${i}`, ip: `6.6.6.${i}` })).ok) allowed++;
  }
  assert.equal(allowed, 6);
});

test("callers with no verified token are capped per IP", async () => {
  const { guard, counts } = setup();
  assert.equal(await callsAllowed(guard, { ip: "1.1.1.1" }, 6), 4);
  assert.equal(await callsAllowed(guard, { ip: "2.2.2.2" }, 1), 1);
  assert.ok([...counts.keys()].every((id) => !id.includes("1.1.1.1")), "raw IPs must not be stored");
});

test("count-only mode never blocks", async () => {
  const { guard, store } = setup({ findAccount: async () => ({ ...OLD, emailVerified: false }) }, { enforce: false });
  assert.equal(await callsAllowed(guard, { uid: "u", ip: "1.1.1.1" }, 30), 30);
  store.failing = true;
  assert.equal(await callsAllowed(guard, { uid: "u", ip: "1.1.1.1" }, 5), 5);
});

test("ipSubject groups an IPv6 /64 and normalizes mapped IPv4", () => {
  assert.equal(ipSubject("2001:db8:1:2:aaaa::1"), ipSubject("2001:db8:1:2:bbbb::9"));
  assert.notEqual(ipSubject("2001:db8:1:2::1"), ipSubject("2001:db8:1:3::1"));
  assert.equal(ipSubject("::1"), "0:0:0:0::/64");
  assert.equal(ipSubject("::ffff:203.0.113.9"), "203.0.113.9");
  assert.equal(ipSubject("203.0.113.9"), "203.0.113.9");
  assert.equal(ipSubject(undefined), "unknown");
});
