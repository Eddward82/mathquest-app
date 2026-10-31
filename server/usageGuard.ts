/**
 * Daily AI usage limits — the defence against mass fake-signup abuse.
 *
 * The per-uid rate limiter in index.ts stops one greedy user, but not 5,000
 * throwaway accounts each taking its own allowance. This adds three layers:
 *
 *   1. A daily cap per user, tiered by trust:
 *        new    – account < NEW_ACCOUNT_HOURS old, or email not verified
 *        free   – everyone else
 *        premium – active RevenueCat "premium" entitlement (needs
 *                  REVENUECAT_SECRET_KEY; without it premium users get "free")
 *      A farm of brand-new accounts therefore gets almost nothing.
 *   2. A global daily circuit breaker across ALL users, which bounds the
 *      worst-case spend no matter how many accounts exist.
 *   3. A webhook alert (Slack/Discord-compatible) when global usage hits 80%
 *      and 100% of the cap, so a spike is noticed the same day.
 *
 * Counters live in Firestore (`aiUsage/*`), so they survive restarts and are
 * shared across instances. Clients can't touch them: firestore.rules has no
 * match for aiUsage, and the Admin SDK bypasses rules. Each doc carries an
 * `expireAt` field — add a Firestore TTL policy on aiUsage.expireAt to have
 * old days deleted automatically.
 *
 * If Firestore itself errors, calls are allowed (fail open) so an outage
 * doesn't break the tutor; the OpenAI project budget is the final backstop.
 *
 * All limits are env-tunable:
 *   AI_DAILY_LIMIT_NEW (5), AI_DAILY_LIMIT_FREE (40), AI_DAILY_LIMIT_PREMIUM (200),
 *   AI_GLOBAL_DAILY_LIMIT (3000), NEW_ACCOUNT_HOURS (24),
 *   ENFORCE_AI_QUOTA ("false" = count only, never block), ALERT_WEBHOOK_URL.
 */

import type { Request, Response } from "express";
import type { App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createHash } from "crypto";

const envInt = (name: string, fallback: number) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const LIMITS = {
  new: envInt("AI_DAILY_LIMIT_NEW", 5),
  free: envInt("AI_DAILY_LIMIT_FREE", 40),
  premium: envInt("AI_DAILY_LIMIT_PREMIUM", 200),
};
const GLOBAL_DAILY_LIMIT = envInt("AI_GLOBAL_DAILY_LIMIT", 3000);
const NEW_ACCOUNT_MS = envInt("NEW_ACCOUNT_HOURS", 24) * 60 * 60 * 1000;
const ENFORCE = process.env.ENFORCE_AI_QUOTA !== "false";
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const REVENUECAT_SECRET_KEY = process.env.REVENUECAT_SECRET_KEY;

type Tier = keyof typeof LIMITS;

// ── Small TTL cache so tier lookups don't hit Auth/RevenueCat every request ──
const TIER_TTL_MS = 10 * 60 * 1000;
const tierCache = new Map<string, { tier: Tier; at: number }>();

function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Keep counters for a week, then let the TTL policy delete them.
function expiry(): Timestamp {
  return Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function hasPremium(uid: string): Promise<boolean> {
  if (!REVENUECAT_SECRET_KEY) return false;
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`,
      { headers: { Authorization: `Bearer ${REVENUECAT_SECRET_KEY}` }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return false;
    const body = (await res.json()) as {
      subscriber?: { entitlements?: Record<string, { expires_date: string | null }> };
    };
    const ent = body.subscriber?.entitlements?.premium;
    return !!ent && (ent.expires_date === null || Date.parse(ent.expires_date) > Date.now());
  } catch (err: any) {
    console.warn("RevenueCat lookup failed:", err?.message);
    return false;
  }
}

async function tierFor(firebaseApp: App, uid: string): Promise<Tier> {
  const cached = tierCache.get(uid);
  if (cached && Date.now() - cached.at < TIER_TTL_MS) return cached.tier;

  const user = await getAuth(firebaseApp).getUser(uid);
  const ageMs = Date.now() - Date.parse(user.metadata.creationTime);
  let tier: Tier;
  if (await hasPremium(uid)) tier = "premium";
  else if (ageMs < NEW_ACCOUNT_MS || !user.emailVerified) tier = "new";
  else tier = "free";

  tierCache.set(uid, { tier, at: Date.now() });
  if (tierCache.size > 50_000) tierCache.clear(); // crude memory bound
  return tier;
}

// ── Global counter ──────────────────────────────────────────────────────────
// Every AI call would otherwise write-contend on one doc inside a transaction.
// Instead: atomic increments (no contention retries) plus a cached read that
// refreshes every few seconds. Overshoot is bounded by a few seconds' traffic.
const GLOBAL_REFRESH_MS = 5000;
let globalCache = { day: "", count: 0, at: 0 };
const alertsSent = new Set<string>();

async function globalCount(firebaseApp: App, day: string): Promise<number> {
  if (globalCache.day === day && Date.now() - globalCache.at < GLOBAL_REFRESH_MS) {
    return globalCache.count;
  }
  const snap = await getFirestore(firebaseApp).doc(`aiUsage/global_${day}`).get();
  globalCache = { day, count: (snap.get("count") as number) ?? 0, at: Date.now() };
  return globalCache.count;
}

function bumpGlobal(firebaseApp: App, day: string) {
  globalCache.count++; // local view, until the next refresh
  getFirestore(firebaseApp)
    .doc(`aiUsage/global_${day}`)
    .set({ count: FieldValue.increment(1), expireAt: expiry() }, { merge: true })
    .catch((err) => console.warn("Global usage increment failed:", err?.message));
}

function maybeAlert(day: string, count: number) {
  for (const pct of [80, 100]) {
    const key = `${day}:${pct}`;
    if (count < (GLOBAL_DAILY_LIMIT * pct) / 100 || alertsSent.has(key)) continue;
    alertsSent.add(key);
    const text =
      pct === 100
        ? `🚨 MathQuest AI tutor PAUSED: global daily cap of ${GLOBAL_DAILY_LIMIT} calls reached (${day} UTC). Check for abuse; raise AI_GLOBAL_DAILY_LIMIT if it's real traffic.`
        : `⚠️ MathQuest AI tutor at ${pct}% of its global daily cap (${count}/${GLOBAL_DAILY_LIMIT}, ${day} UTC).`;
    console.warn(text);
    if (ALERT_WEBHOOK_URL) {
      // `text` for Slack, `content` for Discord.
      fetch(ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, content: text }),
      }).catch((err) => console.warn("Alert webhook failed:", err?.message));
    }
  }
}

/**
 * Reserve one AI call for this request. Returns true if the call may proceed;
 * otherwise a 429 has already been sent. Call it after validating the input
 * and before contacting OpenAI.
 */
export async function reserveAiCall(
  firebaseApp: App,
  req: Request,
  res: Response
): Promise<boolean> {
  const day = utcDay();
  const uid = res.locals.uid as string | undefined;

  try {
    // 1. Global circuit breaker.
    const global = await globalCount(firebaseApp, day);
    if (global >= GLOBAL_DAILY_LIMIT) {
      maybeAlert(day, global);
      if (ENFORCE) {
        res.status(429).json({
          code: "busy",
          error: "The AI tutor is taking a short break. Please try again later.",
        });
        return false;
      }
    }

    // 2. Per-user (or, when auth isn't enforced yet, per-IP) daily cap.
    // IPs are hashed so raw addresses aren't stored. Without a verified uid we
    // can't tell account age, and many real users can share one IP (schools,
    // mobile carriers), so IPs get the "free" allowance, not "new".
    const tier: Tier = uid ? await tierFor(firebaseApp, uid) : "free";
    const subject = uid
      ? `uid_${uid}`
      : `ip_${createHash("sha256").update(req.ip ?? "unknown").digest("hex").slice(0, 32)}`;
    const limit = LIMITS[tier];
    const ref = getFirestore(firebaseApp).doc(`aiUsage/${subject}_${day}`);

    const allowed = await getFirestore(firebaseApp).runTransaction(async (tx) => {
      const used = ((await tx.get(ref)).get("count") as number) ?? 0;
      if (used >= limit && ENFORCE) return false;
      tx.set(ref, { count: used + 1, tier, expireAt: expiry() }, { merge: true });
      return true;
    });

    if (!allowed) {
      res.status(429).json({
        code: "daily_limit",
        error:
          tier === "premium"
            ? "You've reached today's AI tutor limit. It resets at midnight UTC."
            : tier === "new"
              ? "New accounts get a few AI explanations a day while we get to know you. Verify your email and check back tomorrow for more."
              : "You've used today's free AI explanations. Upgrade to Premium for more, or come back tomorrow!",
      });
      return false;
    }

    bumpGlobal(firebaseApp, day);
    maybeAlert(day, global + 1);
    return true;
  } catch (err: any) {
    console.error("Usage guard error (allowing call):", err?.message ?? err);
    return true;
  }
}
