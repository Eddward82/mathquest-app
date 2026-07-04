// ── AI tutor explanation parsing ──────────────────────────────────────────────
// The proxy's system prompt asks the model for:
//
//   EMOJI: <emoji>
//   STEP 1: <title> | <body>
//   ...
//   TIP: <tip>
//
// Models drift from this under sampling, so parsing is deliberately tolerant:
// step markers match case-insensitively in several shapes ("STEP 1:",
// "Step 1 -", "1.", markdown-bold variants), continuation lines attach to the
// previous step, and when no steps can be recognised at all the real AI text
// is shown as a single card. The generic local explanation is reserved for
// genuinely having no usable text (e.g. offline).

export interface ExplanationStep {
  number: number;
  title: string;
  body: string;
}

export interface ExplanationData {
  steps: ExplanationStep[];
  tip: string;
  emoji: string;
}

export function parseStreamedText(text: string): ExplanationData {
  const clean = (s: string) => s.replace(/\*\*?/g, "").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let emoji = "📖";
  let tip = "";
  const steps: ExplanationStep[] = [];

  const pushStep = (raw: string) => {
    const pipeIdx = raw.indexOf("|");
    if (pipeIdx >= 0) {
      steps.push({
        number: steps.length + 1,
        title: clean(raw.slice(0, pipeIdx)) || `Step ${steps.length + 1}`,
        body: clean(raw.slice(pipeIdx + 1)),
      });
    } else {
      steps.push({ number: steps.length + 1, title: `Step ${steps.length + 1}`, body: clean(raw) });
    }
  };

  for (const line of lines) {
    const stripped = clean(line);
    const emojiMatch = /^EMOJI\s*[:\-]\s*(.*)$/i.exec(stripped);
    const tipMatch = /^(?:TIP\s*[:\-]|💡)\s*(.*)$/i.exec(stripped);
    const stepMatch =
      /^STEP\s*\d+\s*[:\-–.)]\s*(.*)$/i.exec(stripped) ?? /^\d+\s*[.)]\s+(.*)$/.exec(stripped);

    if (emojiMatch) {
      if (emojiMatch[1]) emoji = emojiMatch[1].trim();
    } else if (tipMatch) {
      tip = tipMatch[1].trim();
    } else if (stepMatch) {
      pushStep(stepMatch[1]);
    } else if (stripped.includes(" | ")) {
      // Step-shaped line whose marker the model mangled (e.g. "➗: Title | body")
      pushStep(stripped);
    } else if (steps.length > 0) {
      // Continuation of the previous step's body
      const last = steps[steps.length - 1];
      last.body = last.body ? `${last.body} ${stripped}` : stripped;
    }
  }

  if (steps.length === 0) {
    // Real AI text that didn't fit the step template — show it rather than
    // discarding it.
    const full = clean(text);
    if (full.length >= 40) {
      return { emoji, tip, steps: [{ number: 1, title: "Explanation", body: full }] };
    }
    return generateLocalExplanation(text);
  }
  return { steps, tip, emoji };
}

// Offline / no-usable-text fallback. Generic by design — every real AI response
// should be rendered via parseStreamedText instead.
export function generateLocalExplanation(question: string): ExplanationData {
  return {
    emoji: "📖",
    steps: [
      {
        number: 1,
        title: "Read carefully",
        body: "Start by reading the question carefully and identifying what is being asked.",
      },
      {
        number: 2,
        title: "Find the key information",
        body: `Highlight or note the important numbers and operations in: "${question}"`,
      },
      {
        number: 3,
        title: "Choose your method",
        body: "Think about which formula or technique applies here — addition, multiplication, algebra, or geometry?",
      },
      {
        number: 4,
        title: "Show your working",
        body: "Write each step clearly. Showing your working helps you spot mistakes and earns marks in exams.",
      },
      {
        number: 5,
        title: "Check your answer",
        body: "Substitute your answer back into the original problem to verify it makes sense.",
      },
    ],
    tip: "Still stuck? Try drawing a diagram or working backwards from the answer. Maths always clicks eventually — keep going!",
  };
}
