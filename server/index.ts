/**
 * MathQuest AI Proxy Server
 *
 * Proxies OpenAI API requests so the API key never touches the mobile client.
 * Supports both streaming (SSE) and standard JSON responses.
 *
 * Run with: npx ts-node server/index.ts
 * Or build:  tsc && node dist/index.js
 */

import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ── System prompt ─────────────────────────────────────────────────────────────
const TUTOR_SYSTEM_PROMPT = `You are MathQuest Tutor — a friendly, encouraging AI maths teacher for teenagers and exam-prep students.

Your job is to explain maths problems in a clear, beginner-friendly way using numbered steps.

Rules:
- Always respond with a JSON object matching this exact shape:
  {
    "steps": [
      { "number": 1, "title": "Short title", "body": "Clear explanation..." },
      ...
    ],
    "tip": "One memorable tip or encouragement (1-2 sentences).",
    "emoji": "One relevant emoji for the topic"
  }
- Use at most 5 steps. Each step body should be 1-3 sentences — simple and direct.
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
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TUTOR_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Explain how to solve this maths problem step by step:\n\n${question.trim()}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: ExplanationResponse;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If JSON parse fails, wrap the raw text so the client still gets something
      parsed = {
        steps: [{ number: 1, title: "Explanation", body: raw }],
        tip: "Keep practising — you've got this!",
        emoji: "📖",
      };
    }

    return res.json({ explanation: parsed });
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

    let buffer = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        buffer += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // Parse the completed buffer and send the structured result
    try {
      const parsed: ExplanationResponse = JSON.parse(buffer);
      res.write(`data: ${JSON.stringify({ done: true, explanation: parsed })}\n\n`);
    } catch {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }

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

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExplanationStep {
  number: number;
  title: string;
  body: string;
}

interface ExplanationResponse {
  steps: ExplanationStep[];
  tip: string;
  emoji: string;
}
