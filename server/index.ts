/**
 * MathQuest AI Proxy Server
 *
 * Proxies OpenAI API requests so the API key never touches the mobile client.
 * Supports both streaming (SSE) and standard JSON responses.
 *
 * Dev: npm run dev (ts-node). Production: npm start (compiles to dist/, runs node).
 */

import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { initializeApp, applicationDefault, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getAppCheck } from "firebase-admin/app-check";
import {
  configFromEnv,
  createUsageGuard,
  firebaseAccountLookup,
  firestoreUsageStore,
  ipSubject,
  lookupRevenueCatPremium,
  revenueCatHasPremium,
  sendAlert,
} from "./usageGuard";
import { createProgressService, isKnownLesson } from "./progress";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Only the mobile app calls this API, so no CORS headers are served — browsers
// (the only clients CORS gates) get blocked by default.

// Behind a hosting proxy (Render/Railway/etc.), trust the forwarded IP so the
// rate limiter keys on the real client address rather than the proxy's. The
// right hop count depends on the host: if it's too low, every user looks like
// the same proxy IP and shares one per-IP limit. Check it with DEBUG_CLIENT_IP.
app.set("trust proxy", Number.parseInt(process.env.TRUST_PROXY_HOPS ?? "1", 10));

// Off by default. Set DEBUG_CLIENT_IP=true briefly after deploying, and compare
// `ip` here with your real public IP to confirm TRUST_PROXY_HOPS is right.
if (process.env.DEBUG_CLIENT_IP === "true") {
  app.get("/api/debug/client-ip", (req, res) => {
    res.json({ ip: req.ip, forwardedFor: req.header("x-forwarded-for") ?? null });
  });
}

// Bound request bodies — a question is never anywhere near 10 KB.
app.use(express.json({ limit: "10kb" }));

// Fail fast instead of holding a connection open on a stuck upstream call.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30_000,
  maxRetries: 1,
});

// ── Abuse protection for the AI endpoints ──────────────────────────────────────
// These run BEFORE the /api/explain* routes below, so they cover both the
// streaming and non-streaming variants. /api/health is intentionally exempt.

// Firebase ID token check. The app sends `Authorization: Bearer <idToken>`;
// unlike x-app-key it can't be lifted from the bundle, so it proves a real
// signed-in MathQuest user. Enforced only when REQUIRE_FIREBASE_AUTH=true, so
// it can be switched on once app versions that send the token are live.
const REQUIRE_FIREBASE_AUTH = process.env.REQUIRE_FIREBASE_AUTH === "true";

let firebaseApp: App | undefined;
function getFirebaseApp(): App {
  // FIREBASE_SERVICE_ACCOUNT holds the service-account JSON (e.g. on Render);
  // otherwise fall back to GOOGLE_APPLICATION_CREDENTIALS.
  firebaseApp ??= initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      : applicationDefault(),
  });
  return firebaseApp;
}

const usageGuard = createUsageGuard(configFromEnv(), {
  store: firestoreUsageStore(getFirebaseApp),
  findAccount: firebaseAccountLookup(getFirebaseApp),
  hasPremium: revenueCatHasPremium,
  alert: sendAlert,
});

// Reserves one AI call, or sends the refusal and returns false.
async function reserveAiCall(req: Request, res: Response): Promise<boolean> {
  const decision = await usageGuard.reserve({ uid: res.locals.uid, ip: req.ip });
  if (decision.ok) return true;
  res.status(decision.status).json({ code: decision.code, error: decision.error });
  return false;
}

// A token, when sent, is always verified so daily quotas and rate limits count
// per user rather than per IP (many real users share carrier/school IPs). Only
// a missing or invalid token is tolerated while enforcement is off.
// checkRevoked rejects tokens of deleted or disabled accounts straight away,
// rather than letting them work until the token expires up to an hour later.
async function requireFirebaseUser(req: Request, res: Response, next: NextFunction) {
  const match = /^Bearer (.+)$/.exec(req.header("authorization") ?? "");
  if (!match) {
    if (!REQUIRE_FIREBASE_AUTH) return next();
    return res.status(401).json({ error: "Please sign in to use the AI tutor." });
  }
  try {
    const decoded = await getAuth(getFirebaseApp()).verifyIdToken(match[1], true);
    res.locals.uid = decoded.uid;
    next();
  } catch (err: any) {
    if (!REQUIRE_FIREBASE_AUTH) {
      console.warn("ID token not verified (not enforced):", err?.message);
      return next();
    }
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

// Firebase App Check. The app sends `X-Firebase-AppCheck: <token>`, which only
// the genuine Play-installed app can obtain (Play Integrity), so scripts that
// copied x-app-key or a user's ID token are still turned away. Enforced only
// when REQUIRE_APP_CHECK=true; until then failures are just logged, so the
// App Check dashboard can confirm real users pass before switching it on.
const REQUIRE_APP_CHECK = process.env.REQUIRE_APP_CHECK === "true";

async function requireAppCheck(req: Request, res: Response, next: NextFunction) {
  const token = req.header("x-firebase-appcheck");
  try {
    if (!token) throw new Error("missing token");
    await getAppCheck(getFirebaseApp()).verifyToken(token);
    next();
  } catch (err: any) {
    if (!REQUIRE_APP_CHECK) {
      console.warn("App Check not verified (not enforced):", err?.message);
      return next();
    }
    return res.status(401).json({ error: "Please update MathQuest from Google Play to use the AI tutor." });
  }
}

// Rate limit: 30 requests per 10 minutes — per signed-in user when the token
// was verified (one user can't dodge it by switching networks), else per IP.
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => (res.locals.uid ? `uid:${res.locals.uid}` : ipSubject(req.ip)),
  message: { error: "Too many requests — please slow down and try again shortly." },
});

// Rate limit across every account on one IP, so a script can't dodge the limit
// above by cycling through accounts. Generous, as schools and carriers put many
// real users behind one address. Runs first, so floods are turned away before
// any token verification work. AI and progress calls are counted separately.
const createIpLimiter = () =>
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: Number.parseInt(process.env.AI_IP_RATE_LIMIT ?? "120", 10),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `ip:${ipSubject(req.ip)}`,
    message: { error: "Too many requests from this network — please try again shortly." },
  });
const ipLimiter = createIpLimiter();

// Shared-secret check. The mobile app sends `x-app-key`; the server compares it
// to APP_PROXY_KEY. NOTE: because the client value ships in the app bundle this
// is NOT strong authentication — it only deters drive-by bots and scanners that
// scrape the web for open OpenAI proxies. If APP_PROXY_KEY is unset, the check
// is skipped (useful for local development).
function requireAppKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.APP_PROXY_KEY;
  if (expected && req.header("x-app-key") !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.use("/api/explain", requireAppKey, ipLimiter, requireAppCheck, requireFirebaseUser, aiLimiter);

// The app caps questions at 500 chars; anything much longer is not coming from
// the app and would only run up OpenAI token costs.
const MAX_QUESTION_LENGTH = 600;

// Returns the trimmed question, or null after writing a 400 response.
function validateQuestion(req: Request, res: Response): string | null {
  const { question } = req.body as { question?: string };
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    res.status(400).json({ error: "question is required" });
    return null;
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    res.status(400).json({ error: `question must be at most ${MAX_QUESTION_LENGTH} characters` });
    return null;
  }
  return question.trim();
}

// ── System prompt ─────────────────────────────────────────────────────────────
// Plain-text format (no JSON / markdown) so it streams readably to the client,
// which parses it with the matching parser in AIHelpModal.
const TUTOR_SYSTEM_PROMPT = `You are MathQuest Tutor — a friendly, encouraging AI maths teacher for teenagers and exam-prep students.

Your job is to explain how to solve the specific maths problem given. Work through the actual numbers and operations — do not give generic advice.

Write in plain text only (no JSON, no markdown, no asterisks, no bullet points).
Use this format:

EMOJI: <one emoji that fits the topic, e.g. ➗ for division, 📐 for geometry>
STEP 1: <title> | <explanation that works through the actual problem>
STEP 2: <title> | <explanation>
STEP 3: <title> | <explanation>
TIP: <one specific tip tied to this type of problem>

Rules:
- Every step line MUST begin with exactly "STEP <number>: " and stay on a single line — the app parses these markers.
- The first line MUST begin with exactly "EMOJI: " and the last line with exactly "TIP: ".
- Always use the exact numbers from the question. Show the actual calculation at each step.
- Vary your explanation style based on the problem type — algebra steps differ from geometry steps.
- Use 3–5 steps depending on complexity. Simple problems get fewer steps.
- Never repeat the same phrasing across steps.
- Plain language a 13-year-old can follow. Define any term you use.
- Be specific, not generic. "Multiply 4 by 7 to get 28" not "perform the multiplication".`;

// When the user closes the AI tutor mid-answer, the connection drops. Abort the
// OpenAI call too, so we stop generating (and paying for) tokens nobody reads.
function abortOnDisconnect(res: Response): AbortSignal {
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) controller.abort();
  });
  return controller.signal;
}

// ─── POST /api/explain ────────────────────────────────────────────────────────
// Standard JSON response with full explanation
app.post("/api/explain", async (req, res) => {
  const question = validateQuestion(req, res);
  if (question === null) return;
  if (!(await reserveAiCall(req, res))) return;

  const signal = abortOnDisconnect(res);
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 700,
      temperature: 0.5,
      messages: [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Solve this specific maths problem step by step, using the actual numbers given:\n\n${question}`,
        },
      ],
    }, { signal });

    const text = completion.choices[0]?.message?.content ?? "";
    return res.json({ text });
  } catch (err: any) {
    if (signal.aborted) return; // client left — nothing to send
    console.error("OpenAI error:", err?.message ?? err);
    return res.status(500).json({ error: "Failed to generate explanation" });
  }
});

// ─── POST /api/explain/stream ─────────────────────────────────────────────────
// Server-sent events stream — sends the explanation token by token.
// The client receives "data: <chunk>\n\n" events, then "data: [DONE]\n\n".
app.post("/api/explain/stream", async (req, res) => {
  const question = validateQuestion(req, res);
  if (question === null) return;
  if (!(await reserveAiCall(req, res))) return;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const signal = abortOnDisconnect(res);
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 700,
      temperature: 0.5,
      stream: true,
      messages: [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Solve this specific maths problem step by step, using the actual numbers given:\n\n${question}`,
        },
      ],
    }, { signal });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    if (signal.aborted) return; // client closed the tutor — stream already gone
    console.error("OpenAI stream error:", err?.message ?? err);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate explanation" })}\n\n`);
    res.end();
  }
});

// ─── Server-owned progress ────────────────────────────────────────────────────
// Unlike the AI routes, these always need a verified account: they write to it,
// so there's no per-IP mode. See progress.ts.
const progress = createProgressService({
  getApp: getFirebaseApp,
  lookupPremium: lookupRevenueCatPremium,
});
const findAccount = firebaseAccountLookup(getFirebaseApp);

const progressLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (_req, res) => `uid:${res.locals.uid}`,
  message: { error: "Too many requests — please slow down and try again shortly." },
});

async function requireVerifiedAccount(_req: Request, res: Response, next: NextFunction) {
  const uid = res.locals.uid as string | undefined;
  if (!uid) return res.status(401).json({ error: "Please sign in." });
  try {
    const account = await findAccount(uid);
    if (!account || account.disabled) return res.status(401).json({ error: "Please sign in." });
    if (!account.emailVerified) return res.status(403).json({ code: "email_unverified", error: "Please verify your email." });
    res.locals.account = account;
    next();
  } catch (err: any) {
    console.error("Account lookup failed:", err?.message ?? err);
    res.status(503).json({ error: "Please try again shortly." });
  }
}

app.use(
  "/api/progress",
  requireAppKey,
  createIpLimiter(),
  requireAppCheck,
  requireFirebaseUser,
  requireVerifiedAccount,
  progressLimiter
);

// Records that the user started a lesson, or refuses if they're out of free ones.
app.post("/api/progress/lesson-start", async (req, res) => {
  const { lessonId } = req.body as { lessonId?: unknown };
  if (!isKnownLesson(lessonId)) return res.status(400).json({ error: "Unknown lesson" });
  try {
    return res.json(await progress.startLesson(res.locals.uid, lessonId));
  } catch (err: any) {
    console.error("Lesson start failed:", err?.message ?? err);
    return res.status(503).json({ error: "Please try again shortly." });
  }
});

// Updates the user's public leaderboard entry from their saved progress.
app.post("/api/progress/leaderboard-sync", async (_req, res) => {
  try {
    return res.json(await progress.syncLeaderboard(res.locals.uid, res.locals.account));
  } catch (err: any) {
    console.error("Leaderboard sync failed:", err?.message ?? err);
    return res.status(503).json({ error: "Please try again shortly." });
  }
});

// ─── GET /api/health ──────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "MathQuest AI Proxy", model: "gpt-4o-mini" });
});

app.listen(PORT, () => {
  console.log(`✅ MathQuest AI proxy running on http://localhost:${PORT}`);
  console.log(`   Model: gpt-4o-mini`);
  console.log(`   Endpoints: POST /api/explain  |  POST /api/explain/stream`);
});
