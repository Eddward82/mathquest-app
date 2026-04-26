import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ExplanationStep {
  number: number;
  title: string;
  body: string;
}

interface ExplanationData {
  steps: ExplanationStep[];
  tip: string;
  emoji: string;
}

interface AIHelpModalProps {
  visible: boolean;
  question: string;
  onClose: () => void;
}

type Status = "idle" | "loading" | "streaming" | "done" | "error";

// ── Dot loader ────────────────────────────────────────────────────────────────
const Dot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(1);

  useEffect(() => {
    const loop = withRepeat(
      withSequence(
        withTiming(1, { duration: 380 }),
        withTiming(0.3, { duration: 380 })
      ),
      -1,
      true
    );
    opacity.value = withDelay(delay, loop);
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withSpring(1.35, { stiffness: 400, damping: 10 }),
          withSpring(1, { stiffness: 400, damping: 10 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[thinkingStyles.dot, animStyle]} />;
};

const ThinkingDots: React.FC = () => (
  <View style={thinkingStyles.row}>
    <Dot delay={0} />
    <Dot delay={160} />
    <Dot delay={320} />
  </View>
);

const thinkingStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
});

// ── Step card ─────────────────────────────────────────────────────────────────
const StepCard: React.FC<{ step: ExplanationStep; delay: number }> = ({ step, delay }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={stepStyles.card}>
    <View style={stepStyles.numberBadge}>
      <Text style={stepStyles.numberText}>{step.number}</Text>
    </View>
    <View style={stepStyles.content}>
      <Text style={stepStyles.title}>{step.title}</Text>
      <Text style={stepStyles.body}>{step.body}</Text>
    </View>
  </Animated.View>
);

const stepStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FAFBFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#EDE9FF",
    padding: 14,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  numberText: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontWeight: "800", color: "#1F2937", letterSpacing: -0.1 },
  body: { fontSize: 14, color: "#4B5563", lineHeight: 21, fontWeight: "400" },
});

// ── Main modal ────────────────────────────────────────────────────────────────
export const AIHelpModal: React.FC<AIHelpModalProps> = ({ visible, question, onClose }) => {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<ExplanationData | null>(null);
  const [streamText, setStreamText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const sheetY = useSharedValue(SCREEN_HEIGHT);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));

  useEffect(() => {
    if (visible) {
      sheetY.value = withSpring(0, { stiffness: 280, damping: 28 });
      if (question) fetchExplanation();
    } else {
      sheetY.value = withTiming(SCREEN_HEIGHT, { duration: 280 });
      // Cancel any in-flight request
      abortRef.current?.abort();
      setStatus("idle");
      setData(null);
      setStreamText("");
    }
  }, [visible, question]);

  const fetchExplanation = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setData(null);
    setStreamText("");

    const apiKey = process.env.EXPO_PUBLIC_OPENAI_KEY;

    try {
      if (!apiKey) throw new Error("No API key");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 700,
          temperature: 0.4,
          stream: true,
          messages: [
            {
              role: "system",
              content: `You are MathQuest Tutor — a friendly, encouraging AI maths teacher for teenagers.
Explain maths problems clearly using numbered steps. Write in plain text (no JSON, no markdown).
Format your reply exactly like this:

EMOJI: <one relevant emoji>
STEP 1: <short title> | <clear explanation>
STEP 2: <short title> | <clear explanation>
STEP 3: <short title> | <clear explanation>
TIP: <one memorable tip>

Use at most 5 steps. Be simple, warm, and encouraging.`,
            },
            {
              role: "user",
              content: `Explain how to solve this maths question step by step: "${question}"`,
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      // Stream SSE chunks
      setStatus("streaming");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setStreamText(fullText);
            }
          } catch {}
        }
      }

      // Parse the streamed plain-text format
      setData(parseStreamedText(fullText));
      setStatus("done");
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setData(generateLocalExplanation(question));
      setStatus("done");
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <LinearGradient
            colors={[COLORS.primary, "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            {/* Decorative orb */}
            <View style={styles.headerOrb} />

            <View style={styles.headerLeft}>
              <View style={styles.aiIconCircle}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Math Tutor</Text>
                <Text style={styles.headerSub}>Powered by GPT-4o mini</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </LinearGradient>

          {/* ── Question box ───────────────────────────────────────────────── */}
          <View style={styles.questionBox}>
            <Text style={styles.questionLabel}>📌  Question</Text>
            <Text style={styles.questionText}>{question}</Text>
          </View>

          {/* ── Body ───────────────────────────────────────────────────────── */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {status === "loading" && (
              <Animated.View entering={FadeIn} style={styles.thinkingContainer}>
                <View style={styles.thinkingCard}>
                  <ThinkingDots />
                  <Text style={styles.thinkingText}>Working through the solution…</Text>
                </View>
              </Animated.View>
            )}

            {status === "streaming" && streamText.length > 0 && (
              <Animated.View entering={FadeIn} style={styles.streamContainer}>
                <Text style={styles.streamText}>{streamText}</Text>
                <ThinkingDots />
              </Animated.View>
            )}

            {status === "error" && (
              <Animated.View entering={FadeIn} style={styles.errorContainer}>
                <Text style={{ fontSize: 32 }}>😕</Text>
                <Text style={styles.errorTitle}>Couldn't get an explanation</Text>
                <Text style={styles.errorSub}>Check your connection and try again.</Text>
                <TouchableOpacity onPress={fetchExplanation} style={styles.retryBtn}>
                  <Feather name="refresh-cw" size={14} color={COLORS.primary} />
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {status === "done" && data && (
              <View style={styles.explanationContainer}>
                {/* Steps */}
                <View style={styles.stepsHeader}>
                  <Text style={styles.topicEmoji}>{data.emoji}</Text>
                  <Text style={styles.stepsTitle}>Step-by-step solution</Text>
                </View>

                <View style={styles.stepsList}>
                  {data.steps.map((step, i) => (
                    <StepCard key={step.number} step={step} delay={i * 80} />
                  ))}
                </View>

                {/* Tip card */}
                {data.tip ? (
                  <Animated.View entering={FadeInDown.delay(data.steps.length * 80 + 80).springify()} style={styles.tipCard}>
                    <LinearGradient
                      colors={["#FEFCE8", "#FEF9C3"]}
                      style={styles.tipGradient}
                    >
                      <Text style={styles.tipIcon}>💡</Text>
                      <Text style={styles.tipText}>{data.tip}</Text>
                    </LinearGradient>
                  </Animated.View>
                ) : null}
              </View>
            )}
          </ScrollView>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.gotItBtn} activeOpacity={0.88}>
              <LinearGradient
                colors={[COLORS.primary, "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gotItGradient}
              >
                <Feather name="check" size={18} color="#FFFFFF" />
                <Text style={styles.gotItText}>Got it, thanks!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ── Parse plain-text streamed format ──────────────────────────────────────────
function parseStreamedText(text: string): ExplanationData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let emoji = "📖";
  let tip = "";
  const steps: ExplanationStep[] = [];

  for (const line of lines) {
    if (line.startsWith("EMOJI:")) {
      emoji = line.slice(6).trim();
    } else if (line.startsWith("TIP:")) {
      tip = line.slice(4).trim();
    } else if (/^STEP \d+:/.test(line)) {
      const withoutPrefix = line.replace(/^STEP \d+:\s*/, "");
      const pipeIdx = withoutPrefix.indexOf("|");
      const title = pipeIdx >= 0 ? withoutPrefix.slice(0, pipeIdx).trim() : withoutPrefix;
      const body = pipeIdx >= 0 ? withoutPrefix.slice(pipeIdx + 1).trim() : "";
      steps.push({ number: steps.length + 1, title, body });
    }
  }

  if (steps.length === 0) return generateLocalExplanation(text);
  return { steps, tip, emoji };
}

// ── Local fallback ─────────────────────────────────────────────────────────────
function generateLocalExplanation(question: string): ExplanationData {
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    overflow: "hidden",
  },
  headerOrb: {
    position: "absolute",
    top: -24,
    right: -24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 1 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Question box
  questionBox: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: "#F4F5FF",
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    gap: 4,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  questionText: { fontSize: 15, color: "#1F2937", fontWeight: "500", lineHeight: 22 },

  // Body
  body: { paddingHorizontal: 16 },
  bodyContent: { paddingTop: 8, paddingBottom: 16, gap: 16 },

  // Streaming
  streamContainer: { gap: 14, paddingBottom: 8 },
  streamText: { fontSize: 14, color: "#374151", lineHeight: 22, fontWeight: "400" },

  // Thinking
  thinkingContainer: { paddingVertical: 32, alignItems: "center" },
  thinkingCard: {
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F4F5FF",
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 32,
    width: "100%",
  },
  thinkingText: { color: "#6B7280", fontSize: 14, fontWeight: "600" },

  // Error
  errorContainer: { alignItems: "center", paddingVertical: 32, gap: 10 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  errorSub: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#EDE9FF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
  },
  retryText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },

  // Explanation
  explanationContainer: { gap: 14 },
  stepsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  topicEmoji: { fontSize: 22 },
  stepsTitle: { fontSize: 16, fontWeight: "800", color: "#1F2937", letterSpacing: -0.2 },
  stepsList: { gap: 10 },

  // Tip
  tipCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  tipGradient: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    alignItems: "flex-start",
  },
  tipIcon: { fontSize: 18, marginTop: 1 },
  tipText: { flex: 1, fontSize: 14, color: "#78350F", lineHeight: 21, fontWeight: "500" },

  // Footer
  footer: { padding: 16, paddingBottom: 32 },
  gotItBtn: { borderRadius: 18, overflow: "hidden" },
  gotItGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  gotItText: { color: "#FFFFFF", fontWeight: "800", fontSize: 17 },
});
