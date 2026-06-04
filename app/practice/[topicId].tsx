import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, withSpring,
  withSequence, FadeIn, SlideInRight, SlideOutLeft, Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { useProgressStore } from "../../src/store/progressStore";
import { TOPICS, getAllLessons } from "../../src/data/lessons";
import { MultipleChoiceContent, FillBlankContent, LessonStep } from "../../src/types";
import { COLORS } from "../../src/constants/theme";
import { MultipleChoiceQuestion } from "../../src/components/lesson/MultipleChoiceQuestion";
import { FillBlankQuestion } from "../../src/components/lesson/FillBlankQuestion";

const PRACTICE_COUNT = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPracticeQuestions(topicId: string, completedIds: Set<string>): LessonStep[] {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return [];

  const allLessons = getAllLessons();
  const topicLessons = allLessons.filter(
    (l) => l.topic_id === topicId && completedIds.has(l.id)
  );

  // If no completed lessons, use all lessons in topic
  const sourceLessons = topicLessons.length > 0
    ? topicLessons
    : topic.lessons;

  const questions: LessonStep[] = [];
  for (const lesson of sourceLessons) {
    for (const step of lesson.steps) {
      if (step.type !== "explanation") questions.push(step);
    }
  }

  return shuffle(questions).slice(0, PRACTICE_COUNT);
}

export default function PracticeScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { user } = useAuthStore();
  const { completedLessonIds } = useProgressStore();

  const topic = TOPICS.find((t) => t.id === topicId);

  const [sessionKey, setSessionKey] = useState(0);
  const questions = useMemo(
    () => buildPracticeQuestions(topicId ?? "", completedLessonIds),
    [topicId, completedLessonIds, sessionKey]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));
  const xpScale = useSharedValue(1);
  const xpStyle = useAnimatedStyle(() => ({ transform: [{ scale: xpScale.value }] }));

  const handleCorrect = useCallback(() => {
    setCorrect((c) => c + 1);
    setTotal((t) => t + 1);
    xpScale.value = withSequence(
      withSpring(1.4, { stiffness: 500, damping: 12 }),
      withSpring(1, { stiffness: 400, damping: 14 })
    );
  }, []);

  const handleMistake = useCallback(() => setTotal((t) => t + 1), []);

  const handleNext = useCallback(() => {
    const next = currentIndex + 1;
    progressWidth.value = withTiming((next / questions.length) * 100, {
      duration: 500, easing: Easing.out(Easing.cubic),
    });
    if (next >= questions.length) {
      setIsComplete(true);
      progressWidth.value = withTiming(100, { duration: 500 });
    } else {
      setCurrentIndex(next);
    }
  }, [currentIndex, questions.length]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setCorrect(0);
    setTotal(0);
    setIsComplete(false);
    progressWidth.value = withTiming(0, { duration: 300 });
    setSessionKey((k) => k + 1);
  };

  const currentQ = questions[currentIndex];
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  if (!topic) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Topic not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.quitBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{topic.title} Practice</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyEmoji}>📚</Text>
          </View>
          <Text style={styles.emptyTitle}>No questions available yet</Text>
          <Text style={styles.emptyDesc}>
            Complete at least one lesson in {topic.title} to unlock practice mode and drill your skills.
          </Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.emptyBtnWrap}>
            <LinearGradient
              colors={[COLORS.primary, "#8B5CF6"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.emptyBtn}
            >
              <Feather name="book-open" size={15} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Go to Lessons</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.quitBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={styles.modeLabel}>PRACTICE MODE</Text>
          <Text style={styles.topicName} numberOfLines={1}>{topic.title}</Text>
        </View>

        <Animated.View style={[styles.xpPill, xpStyle]}>
          <Text style={styles.xpEmoji}>✅</Text>
          <Text style={styles.xpCount}>{correct}</Text>
        </Animated.View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]}>
          <LinearGradient
            colors={[topic.color, COLORS.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Step meta */}
      {!isComplete && (
        <View style={styles.stepMeta}>
          <View style={[styles.qTypePill, { backgroundColor: topic.color + "18", borderColor: topic.color + "40" }]}>
            <Text style={[styles.qTypeText, { color: topic.color }]}>
              {currentQ?.type === "multiple_choice" ? "🎯 Multiple Choice" : "✏️ Fill in"}
            </Text>
          </View>
          <Text style={styles.stepCounter}>{currentIndex + 1} / {questions.length}</Text>
        </View>
      )}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isComplete ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <PracticeComplete
              correct={correct}
              total={total}
              accuracy={accuracy}
              topicColor={topic.color}
              topicTitle={topic.title}
              onRestart={handleRestart}
              onFinish={() => router.back()}
            />
          </Animated.View>
        ) : currentQ ? (
          <Animated.View
            key={`${sessionKey}-${currentIndex}`}
            entering={SlideInRight.duration(280).springify()}
            exiting={SlideOutLeft.duration(200)}
            style={styles.questionWrap}
          >
            {currentQ.type === "multiple_choice" ? (
              <MultipleChoiceQuestion
                content={currentQ.content as MultipleChoiceContent}
                onCorrect={handleCorrect}
                onMistake={handleMistake}
                onNext={handleNext}
                onAIHelp={() => {}}
              />
            ) : (
              <FillBlankQuestion
                content={currentQ.content as FillBlankContent}
                onCorrect={handleCorrect}
                onMistake={handleMistake}
                onNext={handleNext}
                onAIHelp={() => {}}
              />
            )}
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── PracticeComplete ─────────────────────────────────────────────────────────

const PracticeComplete: React.FC<{
  correct: number; total: number; accuracy: number;
  topicColor: string; topicTitle: string;
  onRestart: () => void; onFinish: () => void;
}> = ({ correct, total, accuracy, topicColor, topicTitle, onRestart, onFinish }) => {
  const emoji = accuracy >= 90 ? "🌟" : accuracy >= 70 ? "💪" : "📖";
  const message = accuracy >= 90
    ? "Outstanding! You really know this topic!"
    : accuracy >= 70
    ? "Great work! Keep practising to master it."
    : "Good effort — every practice session counts!";

  return (
    <View style={styles.completeWrap}>
      {/* Icon */}
      <LinearGradient
        colors={[topicColor, COLORS.primary]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.completeBadge}
      >
        <Text style={styles.completeBadgeEmoji}>{emoji}</Text>
      </LinearGradient>

      <View style={styles.completeTextArea}>
        <Text style={styles.completeTitle}>Practice Done!</Text>
        <Text style={styles.completeTopicName}>{topicTitle}</Text>
        <Text style={styles.completeMessage}>{message}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox emoji="✅" label="Correct" value={`${correct}/${total}`} color="#16A34A" bg="#F0FDF4" border="#86EFAC" />
        <StatBox emoji="🎯" label="Accuracy" value={`${accuracy}%`} color={COLORS.primary} bg="#EDE9FF" border="#C4B5FD" />
        <StatBox emoji="❓" label="Questions" value={`${total}`} color="#0EA5E9" bg="#F0F9FF" border="#BAE6FD" />
      </View>

      {/* Practice doesn't award XP — note */}
      <View style={styles.practiceNote}>
        <Feather name="info" size={14} color="#6B7280" />
        <Text style={styles.practiceNoteText}>Practice mode doesn't award XP — it's just for drilling!</Text>
      </View>

      <View style={styles.btns}>
        <TouchableOpacity onPress={onRestart} style={styles.restartBtn} activeOpacity={0.85}>
          <Feather name="refresh-cw" size={16} color={topicColor} />
          <Text style={[styles.restartBtnText, { color: topicColor }]}>Practice Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onFinish} activeOpacity={0.9} style={styles.finishWrap}>
          <LinearGradient
            colors={[topicColor, COLORS.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.finishBtn}
          >
            <Text style={styles.finishBtnText}>Back to Topics</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StatBox: React.FC<{ emoji: string; label: string; value: string; color: string; bg: string; border: string }> = (
  { emoji, label, value, color, bg, border }
) => (
  <View style={[styles.statBox, { backgroundColor: bg, borderColor: border }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  errorText: { fontSize: 15, color: "#6B7280", fontWeight: "600" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#C7D2FE",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 14, elevation: 6,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: "900", color: "#111827", textAlign: "center" },
  emptyDesc: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 21 },
  emptyBtnWrap: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  backBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  headerBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 8 : 4,
    paddingBottom: 12, gap: 10,
  },
  quitBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  titleBox: { flex: 1 },
  modeLabel: { fontSize: 10, fontWeight: "800", color: "#10B981", letterSpacing: 1 },
  topicName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  xpPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F0FDF4", borderWidth: 1.5, borderColor: "#86EFAC",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
  },
  xpEmoji: { fontSize: 12 },
  xpCount: { color: "#16A34A", fontWeight: "900", fontSize: 13 },

  progressTrack: { marginHorizontal: 16, height: 7, backgroundColor: "#E2E8F0", borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99, overflow: "hidden", minWidth: 7 },

  stepMeta: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  qTypePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  qTypeText: { fontSize: 12, fontWeight: "700" },
  stepCounter: { fontSize: 12, fontWeight: "700", color: "#9CA3AF" },

  body: { flex: 1, paddingHorizontal: 16 },
  bodyContent: { paddingTop: 8, paddingBottom: 32, gap: 16 },
  questionWrap: { gap: 16 },

  completeWrap: { gap: 20, paddingTop: 8 },
  completeBadge: {
    width: 110, height: 110, borderRadius: 55, alignSelf: "center",
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  completeBadgeEmoji: { fontSize: 50 },
  completeTextArea: { alignItems: "center", gap: 4 },
  completeTitle: { fontSize: 26, fontWeight: "900", color: "#111827" },
  completeTopicName: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
  completeMessage: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },

  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1, alignItems: "center", gap: 4, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1.5,
  },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: "#6B7280", fontWeight: "600", textTransform: "uppercase" },

  practiceNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F8FAFF", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  practiceNoteText: { fontSize: 12, color: "#6B7280", flex: 1, fontWeight: "500" },

  btns: { gap: 10 },
  restartBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: COLORS.primary, borderRadius: 16, paddingVertical: 14,
  },
  restartBtnText: { fontWeight: "800", fontSize: 15 },
  finishWrap: {
    borderRadius: 16, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 7,
  },
  finishBtn: { paddingVertical: 16, alignItems: "center" },
  finishBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});
