/**
 * MathQuest AI Proxy Server
 *
 * Proxies OpenAI API requests so the API key never touches the mobile client.
 * Supports both streaming (SSE) and standard JSON responses.
 *
 * Run with: npx ts-node server/index.ts  (npm run dev / npm start)
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Behind a hosting proxy (Render/Railway/etc.), trust the forwarded IP so the
// rate limiter keys on the real client address rather than the proxy's.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

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

// ── System prompt ─────────────────────────────────────────────────────────────
// Plain-text format (no JSON / markdown) so it streams readably to the client,
// which parses it with the matching parser in AIHelpModal.
const TUTOR_SYSTEM_PROMPT = `You are MathQuest Tutor — a friendly, encouraging AI maths teacher for teenagers and exam-prep students.

Explain maths problems clearly using numbered steps. Write in plain text (no JSON, no markdown).
Format your reply exactly like this:

EMOJI: <one relevant emoji>
STEP 1: <short title> | <clear explanation>
STEP 2: <short title> | <clear explanation>
STEP 3: <short title> | <clear explanation>
TIP: <one memorable tip>

Rules:
- Use at most 5 steps. Each explanation should be 1-3 sentences — simple and direct.
- Never just give the final answer in the first step. Build understanding progressively.
- Use plain language a 13-year-old can follow. Avoid jargon unless you immediately define it.
- If the question involves a formula, show it clearly in the step where it's first used.
- Be warm, brief, and encouraging. No walls of text.`;

// ─── POST /api/explain ────────────────────────────────────────────────────────
// Standard JSON response with full explanation
app.post("/api/explain", async (req, res) => {
  const { question } = req.body as { question?: string };

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "question is required" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 700,
      temperature: 0.4,
      messages: [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain how to solve this maths problem step by step:\n\n${question.trim()}`,
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
  const { question } = req.body as { question?: string };

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "question is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 700,
      temperature: 0.4,
      stream: true,
      messages: [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain how to solve this maths problem step by step:\n\n${question.trim()}`,
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
