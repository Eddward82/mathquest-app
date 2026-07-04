/**
 * MathQuest AI Proxy Server
 *
 * Proxies OpenAI API requests so the API key never touches the mobile client.
 * Supports both streaming (SSE) and standard JSON responses.
 *
 * Run with: npx ts-node server/index.ts  (npm run dev / npm start)
 */

import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Only the mobile app calls this API, so no CORS headers are served — browsers
// (the only clients CORS gates) get blocked by default.

// Behind a hosting proxy (Render/Railway/etc.), trust the forwarded IP so the
// rate limiter keys on the real client address rather than the proxy's.
app.set("trust proxy", 1);

// Bound request bodies — a question is never anywhere near 10 KB.
app.use(express.json({ limit: "10kb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ── Abuse protection for the AI endpoints ──────────────────────────────────────
// These run BEFORE the /api/explain* routes below, so they cover both the
// streaming and non-streaming variants. /api/health is intentionally exempt.

// Per-IP rate limit: 30 requests per 10 minutes.
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down and try again shortly." },
});

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

app.use("/api/explain", aiLimiter, requireAppKey);

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

// ─── POST /api/explain ────────────────────────────────────────────────────────
// Standard JSON response with full explanation
app.post("/api/explain", async (req, res) => {
  const question = validateQuestion(req, res);
  if (question === null) return;

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
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return res.json({ text });
  } catch (err: any) {
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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

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
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("OpenAI stream error:", err?.message ?? err);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate explanation" })}\n\n`);
    res.end();
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
