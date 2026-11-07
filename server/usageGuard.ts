/**
 * Daily AI usage limits — the defence against mass fake-signup abuse.
 *
 * The per-uid rate limiter in index.ts stops one greedy user, but not 5,000
 * throwaway accounts each taking its own allowance. This adds:
 *
 *   1. Account checks: deleted, disabled and unverified-email accounts get no
 *      AI calls at all.
 *   2. A daily cap per user, tiered by trust:
 *        new     – verified account younger than NEW_ACCOUNT_HOURS
 *        free    – everyone else
 *        premium – active RevenueCat "premium" entitlement (needs
 *                  REVENUECAT_SECRET_KEY; without it premium users get "free")
 *   3. A daily cap per IP across all signed-in accounts, so one machine can't
 *      add up thousands of accounts' allowances.
 *   4. A global daily circuit breaker across ALL users, which bounds the
 *      worst-case spend no matter how many accounts exist.
 *   5. A webhook alert (Slack/Discord-compatible) when global usage hits 80%
 *      and 100% of the cap, or when the counters stop working.
 *
 * Counters live in Firestore (`aiUsage/*`), so they survive restarts and are
 * shared across instances. Clients can't touch them: firestore.rules has no
 * match for aiUsage, and the Admin SDK bypasses rules. Each doc carries an
 * `expireAt` field — add a Firestore TTL policy on aiUsage.expireAt to have
 * old days deleted automatically.
 *
 * Every allowed call is counted somewhere. If Firestore errors, a much stricter
 * in-memory allowance takes over, so an outage degrades the tutor instead of
 * removing every limit. If an account lookup errors, the call still counts, at
 * the lowest tier.
 *
 * All limits are env-tunable:
 *   AI_DAILY_LIMIT_NEW (5), AI_DAILY_LIMIT_FREE (40), AI_DAILY_LIMIT_PREMIUM (200),
 *   AI_DAILY_LIMIT_PER_IP (300), AI_GLOBAL_DAILY_LIMIT (3000), NEW_ACCOUNT_HOURS (24),
 *   AI_FALLBACK_DAILY_LIMIT (300), AI_FALLBACK_LIMIT_PER_USER (5),
 *   AI_FALLBACK_LIMIT_PER_IP (20),
 *   ENFORCE_AI_QUOTA ("false" = count only, never block), ALERT_WEBHOOK_URL.
 */

import type { App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createHash } from "crypto";
import { isIPv6 } from "net";

export type Tier = "new" | "free" | "premium";

export interface GuardConfig {
  limits: Record<Tier, number>;
  perIpDailyLimit: number;
  globalDailyLimit: number;
  newAccountMs: number;
  fallbackDailyLimit: number;
  fallbackPerUser: number;
  fallbackPerIp: number;
  enforce: boolean;
}

/** One daily counter that a call has to fit inside. */
export interface Counter {
  id: string;
  limit: number;
  tier?: Tier;
}

export interface UsageStore {
  readGlobal(day: string): Promise<number>;
  incrementGlobal(day: string): Promise<void>;
  /**
   * Atomically adds one to every counter, or to none of them if any is already
   * at its limit. Returns the counter that was full, or null on success.
   */
  take(counters: Counter[]): Promise<Counter | null>;
}

export interface Account {
  createdAtMs: number;
  emailVerified: boolean;
  disabled: boolean;
  displayName?: string;
}

export interface GuardDeps {
  store: UsageStore;
  /** Resolves to null when the account doesn't exist. */
  findAccount(uid: string): Promise<Account | null>;
  hasPremium(uid: string): Promise<boolean>;
  alert(text: string): void;
  now?(): number;
}

export type Decision =
  | { ok: true }
  | { ok: false; status: number; code: string; error: string };

const ALLOW: Decision = { ok: true };

const BUSY: Decision = {
  ok: false,
  status: 429,
  code: "busy",
  error: "The AI tutor is taking a short break. Please try again later.",
};

const TIER_TTL_MS = 10 * 60 * 1000;
// Every AI call would otherwise write-contend on one doc inside a transaction.
// Instead: atomic increments (no contention retries) plus a cached read that
// refreshes every few seconds. Overshoot is bounded by a few seconds' traffic.
const GLOBAL_REFRESH_MS = 5000;

function dailyLimitMessage(tier: Tier): string {
  if (tier === "premium") return "You've reached today's AI tutor limit. It resets at midnight UTC.";
  if (tier === "new") return "New accounts get a few AI explanations a day while we get to know you. Check back tomorrow for more.";
  return "You've used today's free AI explanations. Upgrade to Premium for more, or come back tomorrow!";
}

/**
 * Reduces an address to the unit a single client controls. One IPv6 customer
 * usually gets a whole /64, so counting full addresses would let them rotate
 * past any per-IP limit.
 */
export function ipSubject(ip: string | undefined): string {
  if (!ip) return "unknown";
  const address = ip.replace(/^::ffff:/i, "");
  if (!isIPv6(address)) return address;
  const [head, tail = ""] = address.split("::");
  const start = head ? head.split(":") : [];
  const end = tail ? tail.split(":") : [];
  const groups = [...start, ...Array(Math.max(0, 8 - start.length - end.length)).fill("0"), ...end];
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(":")}::/64`;
}

// IPs are hashed so raw addresses aren't stored.
function hashIp(ip: string | undefined): string {
  return createHash("sha256").update(ipSubject(ip)).digest("hex").slice(0, 32);
}

export function createUsageGuard(config: GuardConfig, deps: GuardDeps) {
  const now = deps.now ?? Date.now;
  const tierCache = new Map<string, { tier: Tier; at: number }>();
  const alertsSent = new Set<string>();
  let globalCache = { day: "", count: 0, at: 0 };
  let fallback = { day: "", total: 0, subjects: new Map<string, number>() };

  function alertOnce(key: string, text: string) {
    if (alertsSent.has(key)) return;
    alertsSent.add(key);
    deps.alert(text);
  }

  function alertOnGlobalUsage(day: string, count: number) {
    if (count >= config.globalDailyLimit * 0.8) {
      alertOnce(
        `${day}:80`,
        `⚠️ MathQuest AI tutor at 80% of its global daily cap (${count}/${config.globalDailyLimit}, ${day} UTC).`
      );
    }
    if (count >= config.globalDailyLimit) {
      alertOnce(
        `${day}:100`,
        `🚨 MathQuest AI tutor PAUSED: global daily cap of ${config.globalDailyLimit} calls reached (${day} UTC). Check for abuse; raise AI_GLOBAL_DAILY_LIMIT if it's real traffic.`
      );
    }
  }

  async function globalCount(day: string): Promise<number> {
    if (globalCache.day === day && now() - globalCache.at < GLOBAL_REFRESH_MS) {
      return globalCache.count;
    }
    globalCache = { day, count: await deps.store.readGlobal(day), at: now() };
    return globalCache.count;
  }

  /** Returns the tier to count this call under, or a refusal. */
  async function resolveTier(uid: string): Promise<Tier | Decision> {
    const cached = tierCache.get(uid);
    if (cached && now() - cached.at < TIER_TTL_MS) return cached.tier;

    let account: Account | null;
    try {
      account = await deps.findAccount(uid);
    } catch (err: any) {
      // Can't tell who this is: still count the call, at the lowest allowance.
      console.warn("Account lookup failed:", err?.message);
      return "new";
    }

    if (!account || account.disabled) {
      if (!config.enforce) return "new";
      return { ok: false, status: 401, code: "account_invalid", error: "Your session has expired. Please sign in again." };
    }
    if (!account.emailVerified) {
      if (!config.enforce) return "new";
      // Not cached, so the tutor works as soon as they verify.
      return {
        ok: false,
        status: 403,
        code: "email_unverified",
        error: "Please verify your email to use the AI tutor. Check your inbox for the link we sent you.",
      };
    }

    let tier: Tier;
    if (await deps.hasPremium(uid)) tier = "premium";
    else if (now() - account.createdAtMs < config.newAccountMs) tier = "new";
    else tier = "free";

    tierCache.set(uid, { tier, at: now() });
    if (tierCache.size > 50_000) tierCache.clear(); // crude memory bound
    return tier;
  }

  /** The allowance used while the Firestore counters are unavailable. */
  function reserveFromFallback(day: string, uid: string | undefined, ipHash: string): Decision {
    if (!config.enforce) return ALLOW;
    if (fallback.day !== day) fallback = { day, total: 0, subjects: new Map() };

    const subjects: [string, number][] = [[`ip:${ipHash}`, config.fallbackPerIp]];
    if (uid) subjects.push([`uid:${uid}`, config.fallbackPerUser]);

    const full =
      fallback.total >= config.fallbackDailyLimit ||
      subjects.some(([key, limit]) => (fallback.subjects.get(key) ?? 0) >= limit);
    if (full) return BUSY;

    fallback.total++;
    for (const [key] of subjects) {
      fallback.subjects.set(key, (fallback.subjects.get(key) ?? 0) + 1);
    }
    return ALLOW;
  }

  /**
   * Reserve one AI call. Call it after validating the input and before
   * contacting OpenAI.
   */
  async function reserve({ uid, ip }: { uid?: string; ip?: string }): Promise<Decision> {
    const day = new Date(now()).toISOString().slice(0, 10); // YYYY-MM-DD, UTC
    const ipHash = hashIp(ip);

    // Without a verified uid (auth not enforced yet) we can't tell account age,
    // and many real users can share one IP, so IPs get the "free" allowance.
    let tier: Tier = "free";
    if (uid) {
      const resolved = await resolveTier(uid);
      if (typeof resolved !== "string") return resolved;
      tier = resolved;
    }

    const limitFor = (limit: number) => (config.enforce ? limit : Infinity);
    const counters: Counter[] = uid
      ? [
          { id: `uid_${uid}_${day}`, limit: limitFor(config.limits[tier]), tier },
          { id: `ipall_${ipHash}_${day}`, limit: limitFor(config.perIpDailyLimit) },
        ]
      : [{ id: `ip_${ipHash}_${day}`, limit: limitFor(config.limits.free), tier }];

    try {
      const global = await globalCount(day);
      if (global >= config.globalDailyLimit) {
        alertOnGlobalUsage(day, global);
        if (config.enforce) return BUSY;
      }

      const full = await deps.store.take(counters);
      if (full) {
        console.warn(`AI quota reached: ${full.id.split("_")[0]} (limit ${full.limit})`);
        return {
          ok: false,
          status: 429,
          code: full.tier ? "daily_limit" : "network_limit",
          error: full.tier
            ? dailyLimitMessage(full.tier)
            : "Too many AI explanations from this network today. Please try again tomorrow.",
        };
      }

      globalCache.count++; // local view, until the next refresh
      deps.store
        .incrementGlobal(day)
        .catch((err) => console.warn("Global usage increment failed:", err?.message));
      alertOnGlobalUsage(day, global + 1);
      return ALLOW;
    } catch (err: any) {
      console.error("Usage guard error (using fallback limits):", err?.message ?? err);
      alertOnce(
        `${day}:store`,
        `🚨 MathQuest AI usage counters are failing (${day} UTC), so the tutor is on strict fallback limits (${config.fallbackDailyLimit} calls/day per server). Check Firestore and FIREBASE_SERVICE_ACCOUNT. Error: ${err?.message ?? err}`
      );
      return reserveFromFallback(day, uid, ipHash);
    }
  }

  return { reserve };
}

// ── Production wiring ───────────────────────────────────────────────────────

const envInt = (name: string, fallback: number) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export function configFromEnv(): GuardConfig {
  return {
    limits: {
      new: envInt("AI_DAILY_LIMIT_NEW", 5),
      free: envInt("AI_DAILY_LIMIT_FREE", 40),
      premium: envInt("AI_DAILY_LIMIT_PREMIUM", 200),
    },
    perIpDailyLimit: envInt("AI_DAILY_LIMIT_PER_IP", 300),
    globalDailyLimit: envInt("AI_GLOBAL_DAILY_LIMIT", 3000),
    newAccountMs: envInt("NEW_ACCOUNT_HOURS", 24) * 60 * 60 * 1000,
    fallbackDailyLimit: envInt("AI_FALLBACK_DAILY_LIMIT", 300),
    fallbackPerUser: envInt("AI_FALLBACK_LIMIT_PER_USER", 5),
    fallbackPerIp: envInt("AI_FALLBACK_LIMIT_PER_IP", 20),
    enforce: process.env.ENFORCE_AI_QUOTA !== "false",
  };
}

// Keep counters for a week, then let the TTL policy delete them.
function expiry(): Timestamp {
  return Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

/** Takes a getter, so a bad Firebase credential surfaces inside the guard's error handling. */
export function firestoreUsageStore(getApp: () => App): UsageStore {
  const db = () => getFirestore(getApp());
  return {
    async readGlobal(day) {
      const snap = await db().doc(`aiUsage/global_${day}`).get();
      return (snap.get("count") as number) ?? 0;
    },
    async incrementGlobal(day) {
      await db()
        .doc(`aiUsage/global_${day}`)
        .set({ count: FieldValue.increment(1), expireAt: expiry() }, { merge: true });
    },
    take(counters) {
      return db().runTransaction(async (tx) => {
        const refs = counters.map((c) => db().doc(`aiUsage/${c.id}`));
        const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));
        const counts = snaps.map((snap) => (snap.get("count") as number) ?? 0);

        const full = counters.find((c, i) => counts[i] >= c.limit);
        if (full) return full;

        counters.forEach((c, i) => {
          tx.set(
            refs[i],
            { count: counts[i] + 1, ...(c.tier ? { tier: c.tier } : {}), expireAt: expiry() },
            { merge: true }
          );
        });
        return null;
      });
    },
  };
}

export function firebaseAccountLookup(getApp: () => App) {
  return async (uid: string): Promise<Account | null> => {
    try {
      const user = await getAuth(getApp()).getUser(uid);
      return {
        createdAtMs: Date.parse(user.metadata.creationTime),
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        displayName: user.displayName,
      };
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") return null;
      throw err;
    }
  };
}

/** Resolves to null when the subscription can't be checked. */
export async function lookupRevenueCatPremium(uid: string): Promise<boolean | null> {
  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!secretKey) return null;
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
      { headers: { Authorization: `Bearer ${secretKey}` }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      subscriber?: { entitlements?: Record<string, { expires_date: string | null }> };
    };
    const ent = body.subscriber?.entitlements?.premium;
    return !!ent && (ent.expires_date === null || Date.parse(ent.expires_date) > Date.now());
  } catch (err: any) {
    console.warn("RevenueCat lookup failed:", err?.message);
    return null;
  }
}

export async function revenueCatHasPremium(uid: string): Promise<boolean> {
  return (await lookupRevenueCatPremium(uid)) === true;
}

export function sendAlert(text: string) {
  console.warn(text);
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  // `text` for Slack, `content` for Discord.
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, content: text }),
  }).catch((err) => console.warn("Alert webhook failed:", err?.message));
}
