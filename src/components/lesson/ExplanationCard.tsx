import React from "react";
import { View, Text, StyleSheet, Platform, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ExplanationContent } from "../../types";

const BRAND = "#6C5CE7";
const BRAND_DEEP = "#5843D4";
const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

interface ExplanationCardProps {
  content: ExplanationContent;
  /** e.g. "Arithmetic" — shown under the title. */
  topicTitle?: string;
  /** 1-based lesson position within its topic. */
  lessonNumber?: number;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({ content, topicTitle, lessonNumber }) => {
  const paragraphs = splitParagraphs(content.body);
  const [lead, ...keyPoints] = paragraphs;
  const example = content.example ? splitExample(content.example) : null;
  const subtitle = [topicTitle, lessonNumber ? `Lesson ${lessonNumber}` : null].filter(Boolean).join(" • ");

  return (
    <View style={styles.stack}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={["#7764F6", BRAND, "#5947DB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.watermarkBig} pointerEvents="none">+ = %</Text>
        <Text style={styles.watermarkSmall} pointerEvents="none">π</Text>
        <View style={styles.heroIcon}>
          <Text style={styles.heroEmoji}>📖</Text>
        </View>
        <Text style={styles.heroTitle}>{content.title}</Text>
        {!!subtitle && <Text style={styles.heroSub}>{subtitle}</Text>}
      </LinearGradient>

      {/* ── Core concept ─────────────────────────────────────────────────── */}
      <View style={styles.concept}>
        <View style={styles.conceptAccent} />
        {!!lead && (
          <Text style={styles.conceptText}>
            <RichText text={lead} boldStyle={styles.termChip} />
          </Text>
        )}
        {keyPoints.map((p, i) => (
          <View key={i} style={styles.keyPoint}>
            <View style={styles.keyPointTile}>
              <Text style={styles.keyPointGlyph}>{glyphFor(p)}</Text>
            </View>
            <Text style={styles.keyPointText}>
              <RichText text={p} boldStyle={styles.keyPointBold} />
            </Text>
          </View>
        ))}
      </View>

      {/* ── Worked example ───────────────────────────────────────────────── */}
      {example && (
        <View style={styles.example}>
          <View style={styles.exampleAccent} />
          <View style={styles.exampleHeader}>
            <Text style={styles.exampleEmoji}>✏️</Text>
            <Text style={styles.exampleLabel}>WORKED EXAMPLE</Text>
          </View>

          {example.equation && (
            <View style={styles.equationBox}>
              <Equation text={example.equation} />
            </View>
          )}

          {example.notes.length > 0 && (
            <View style={styles.notes}>
              {example.notes.map((block, i) => (
                <Text key={i} style={styles.notesText}>
                  <RichText text={block} boldStyle={styles.notesBold} />
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Pro tip ──────────────────────────────────────────────────────── */}
      {!!content.tip && (
        <View style={styles.tip}>
          <View style={styles.tipAccent} />
          <View style={styles.tipHeader}>
            <Text style={styles.tipEmoji}>⚡</Text>
            <Text style={styles.tipLabel}>PRO TIP</Text>
          </View>
          <Text style={styles.tipText}>
            <RichText text={content.tip} boldStyle={styles.tipBold} />
          </Text>
        </View>
      )}
    </View>
  );
};

// ── RichText: renders **bold** segments with a custom style ──────────────────

const RichText: React.FC<{ text: string; boldStyle: TextStyle }> = ({ text, boldStyle }) => (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
        <Text key={i} style={boldStyle}>{part.slice(2, -2)}</Text>
      ) : (
        part
      )
    )}
  </>
);

// ── Equation: big mono equation with coloured operators and result ───────────

// "/" is left out on purpose: in this content it's a fraction bar (3/8), not ÷.
const OPERATOR = /([+−×÷<>≤≥])/;

const Equation: React.FC<{ text: string }> = ({ text }) => {
  // Everything after the last "=" is the result.
  const eq = text.lastIndexOf("=");
  const lhs = eq >= 0 ? text.slice(0, eq) : text;
  const rhs = eq >= 0 ? text.slice(eq + 1) : "";

  const colourOps = (s: string, keyPrefix: string) =>
    s.split(/(=)/).flatMap((chunk, ci) =>
      chunk === "="
        ? [<Text key={`${keyPrefix}e${ci}`} style={styles.eqEquals}>=</Text>]
        : chunk.split(OPERATOR).map((tok, ti) =>
            OPERATOR.test(tok) && tok.length === 1
              ? <Text key={`${keyPrefix}${ci}-${ti}`} style={styles.eqOp}>{tok}</Text>
              : tok
          )
    );

  return (
    <Text style={styles.eqText} adjustsFontSizeToFit numberOfLines={1}>
      {colourOps(lhs, "l")}
      {eq >= 0 && <Text style={styles.eqEquals}>=</Text>}
      {!!rhs && <Text style={styles.eqResult}>{rhs}</Text>}
    </Text>
  );
};

// ── Content helpers ──────────────────────────────────────────────────────────

function splitParagraphs(text: string) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/**
 * Pull a short headline equation (e.g. "15 + 27 = 42") off the top of an
 * example so it can be shown big. Anything wordy stays in the notes.
 */
function splitExample(example: string): { equation: string | null; notes: string[] } {
  const lines = example.split("\n");
  const first = lines[0].replace(/\*\*/g, "").trim();
  const isEquation =
    first.length > 0 &&
    first.length <= 30 &&
    /[=<>≤≥]/.test(first) &&
    !first.endsWith(":") &&
    !/[A-Za-z]{3,}/.test(first) &&
    !first.startsWith("\"");

  const rest = isEquation ? lines.slice(1).join("\n") : example;
  return { equation: isEquation ? first : null, notes: splitParagraphs(rest) };
}

/** Use a maths symbol the paragraph highlights (e.g. **+**) as the tile glyph. */
function glyphFor(paragraph: string) {
  const bolds = [...paragraph.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].trim());
  const symbol = bolds.find((b) => b.length <= 2 && /[^A-Za-z0-9]/.test(b));
  return symbol ?? "✦";
}

// ── Styles ───────────────────────────────────────────────────────────────────

const card = {
  borderRadius: 24,
  padding: 20,
  overflow: "hidden",
} as const;

const styles = StyleSheet.create({
  stack: { gap: 14 },

  // Hero
  hero: {
    ...card,
    alignItems: "center",
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  watermarkBig: {
    position: "absolute",
    right: -6,
    bottom: -14,
    fontFamily: MONO,
    fontSize: 64,
    fontWeight: "800",
    color: "rgba(255,255,255,0.1)",
  },
  watermarkSmall: {
    position: "absolute",
    right: 52,
    top: 4,
    fontFamily: MONO,
    fontSize: 36,
    fontWeight: "800",
    color: "rgba(255,255,255,0.1)",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroEmoji: { fontSize: 24 },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(237,233,254,0.9)",
    marginTop: 4,
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // Core concept
  concept: {
    ...card,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    gap: 16,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  conceptAccent: {
    position: "absolute",
    left: 0,
    top: 24,
    width: 6,
    height: 40,
    borderRadius: 3,
    backgroundColor: "#7C5CF7",
  },
  conceptText: { fontSize: 15, lineHeight: 24, color: "#334155" },
  termChip: {
    fontWeight: "800",
    color: BRAND_DEEP,
    backgroundColor: "#EBE8FF",
  },
  keyPoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(245,243,255,0.8)",
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  keyPointTile: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "#7C5CF7",
    alignItems: "center",
    justifyContent: "center",
  },
  keyPointGlyph: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  keyPointText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: "#475569", fontWeight: "500" },
  keyPointBold: { fontWeight: "800", color: BRAND },

  // Worked example
  example: {
    ...card,
    backgroundColor: "#FFF7F0",
    borderWidth: 2,
    borderColor: "#FEDEC7",
    overflow: "visible",
  },
  exampleAccent: {
    position: "absolute",
    left: -2,
    top: 16,
    bottom: 16,
    width: 6,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#F97316",
  },
  exampleHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, paddingLeft: 4 },
  exampleEmoji: { fontSize: 12 },
  exampleLabel: { fontSize: 12, fontWeight: "800", color: "#EA580C", letterSpacing: 0.8 },
  equationBox: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(254,215,170,0.7)",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  eqText: { fontFamily: MONO, fontSize: 24, fontWeight: "800", color: "#1E293B", letterSpacing: 1 },
  eqOp: { color: "#F97316" },
  eqEquals: { color: "#94A3B8" },
  eqResult: { color: BRAND },
  notes: {
    backgroundColor: "rgba(255,237,213,0.45)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(254,215,170,0.5)",
    padding: 12,
    gap: 8,
  },
  notesText: { fontFamily: MONO, fontSize: 12.5, lineHeight: 20, color: "rgba(67,20,7,0.85)" },
  notesBold: { fontWeight: "800", color: "#C2410C" },

  // Pro tip
  tip: {
    ...card,
    padding: 18,
    backgroundColor: "#FFFDF0",
    borderWidth: 2,
    borderColor: "#FEF08A",
    overflow: "visible",
  },
  tipAccent: {
    position: "absolute",
    left: -2,
    top: 16,
    bottom: 16,
    width: 6,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#EAB308",
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, paddingLeft: 4 },
  tipEmoji: { fontSize: 12 },
  tipLabel: { fontSize: 12, fontWeight: "800", color: "#B45309", letterSpacing: 0.8 },
  tipText: { fontSize: 13.5, lineHeight: 21, color: "#78350F", fontWeight: "500", paddingLeft: 4 },
  tipBold: {
    fontWeight: "800",
    color: "#451A03",
    textDecorationLine: "underline",
    textDecorationColor: "#FCD34D",
  },
});
