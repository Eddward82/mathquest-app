import React, { useState, useEffect, useRef, useCallback } from "react";
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
// React Native's built-in fetch never exposes response.body (no streaming),
// so SSE must go through expo/fetch, which implements ReadableStream.
import { fetch as streamingFetch } from "expo/fetch";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";
import {
  ExplanationData,
  ExplanationStep,
  parseStreamedText,
  generateLocalExplanation,
} from "../../lib/explanationParser";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AIHelpModalProps {
  visible: boolean;
  question: string;
  onClose: () => void;
}

type Status = "idle" | "loading" | "streaming" | "done" | "error";

const AI_COOLDOWN_MS = 5000;

function sanitizeQuestion(input: string): string {
  return input.replace(/["""''`]/g, "'").slice(0, 500).trim();
}

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
  const [slowHint, setSlowHint] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<number>(0);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sheetY = useSharedValue(SCREEN_HEIGHT);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));

  useEffect(() => {
    if (visible) {
      sheetY.value = withSpring(0, { stiffness: 280, damping: 28 });
      if (question) fetchExplanation();
    } else {
      sheetY.value = withTiming(SCREEN_HEIGHT, { duration: 280 });
      abortRef.current?.abort();
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setStatus("idle");
      setData(null);
      setStreamText("");
      setSlowHint(false);
    }
  }, [visible, question]);

  const fetchExplanation = async () => {
    // Rate limit: prevent spamming
    const now = Date.now();
    if (now - lastFetchRef.current < AI_COOLDOWN_MS && status === "done") return;
    lastFetchRef.current = now;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setData(null);
    setStreamText("");
    setSlowHint(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setSlowHint(true), 8000);

    // AI requests are proxied through our backend so the OpenAI key never
    // ships inside the client bundle. Configure EXPO_PUBLIC_API_URL to point
    // at the deployed server/index.ts proxy.
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const safeQuestion = sanitizeQuestion(question);

    // Shared secret checked by the proxy (deters drive-by abuse of the
    // public endpoint). Configured via EXPO_PUBLIC_APP_PROXY_KEY.
    const headers = {
      "Content-Type": "application/json",
      ...(process.env.EXPO_PUBLIC_APP_PROXY_KEY
        ? { "x-app-key": process.env.EXPO_PUBLIC_APP_PROXY_KEY }
        : {}),
    };
    const body = JSON.stringify({ question: safeQuestion });

    try {
      if (!apiUrl) throw new Error("No API URL configured");

      const response = await streamingFetch(`${apiUrl}/api/explain/stream`, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      // Stream SSE chunks
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setSlowHint(false);
      setStatus("streaming");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      if (!reader) throw new Error("No reader");

      // SSE events can be split across network chunks, so accumulate into a
      // buffer and only consume lines that are newline-terminated — the
      // unterminated tail carries over to the next chunk. decode() with
      // {stream: true} likewise keeps split multi-byte characters intact.
      const consumeLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.delta) {
            fullText += parsed.delta;
            setStreamText(fullText);
          }
        } catch {}
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(consumeLine);
      }
      buffer += decoder.decode(); // flush any buffered partial character
      consumeLine(buffer);

      if (!fullText.trim()) throw new Error("Empty stream");

      // Parse the streamed plain-text format
      setData(parseStreamedText(fullText));
      setStatus("done");
    } catch (err: any) {
      if (err?.name === "AbortError") return;

      // Streaming failed — try the plain JSON endpoint before giving up.
      // RN's built-in fetch handles this fine (no body streaming involved).
      try {
        if (!apiUrl) throw new Error("No API URL configured");

        const response = await fetch(`${apiUrl}/api/explain`, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const { text } = (await response.json()) as { text?: string };
        if (!text || !text.trim()) throw new Error("Empty response");

        if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        setSlowHint(false);
        setData(parseStreamedText(text));
        setStatus("done");
      } catch (err2: any) {
        if (err2?.name === "AbortError") return;
        // Both endpoints unreachable — offline-style generic explanation.
        setData(generateLocalExplanation(question));
        setStatus("done");
      }
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
                  {slowHint && (
                    <Text style={styles.slowHintText}>
                      Taking a little longer than usual — almost there...
                    </Text>
                  )}
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
  slowHintText: { color: "#9CA3AF", fontSize: 12, marginTop: 8, textAlign: "center" },

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
