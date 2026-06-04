import React, { useEffect, useCallback, useRef, useState } from "react";
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
import { getTopicReview, ReviewQuestion, PASS_MARK, REVIEW_XP_REWARD } from "../../src/data/topicReviews";
import { TOPICS } from "../../src/data/lessons";
import { MultipleChoiceContent, FillBlankContent } from "../../src/types";
import { COLORS, BORDER_RADIUS } from "../../src/constants/theme";
import { MultipleChoiceQuestion } from "../../src/components/lesson/MultipleChoiceQuestion";
import { FillBlankQuestion } from "../../src/components/lesson/FillBlankQuestion";

export default function TopicReviewScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const { user } = useAuthStore();
  const { completeReview } = useProgressStore();

  const topic = TOPICS.find((t) => t.id === topicId);
  const questions = getTopicReview(topicId ?? "");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [saved, setSaved] = useState(false);

  const startTime = useRef(Date.now());
  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));
  const xpScale = useSharedValue(1);
  const xpStyle = useAnimatedStyle(() => ({ transform: [{ scale: xpScale.value }] }));

  useEffect(() => {
    progressWidth.value = withTiming(
      questions.length > 0 ? (currentIndex / questions.length) * 100 : 0,
      { duration: 500, easing: Easing.out(Easing.cubic) }
    );
  }, [currentIndex]);

  const handleCorrect = useCallback(() => {
    setCorrect((c) => c + 1);
    xpScale.value = withSequence(
      withSpring(1.4, { stiffness: 500, damping: 12 }),
      withSpring(1, { stiffness: 400, damping: 14 })
    );
  }, []);

  const handleMistake = useCallback(() => setMistakes((m) => m + 1), []);

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) {
      setIsComplete(true);
      progressWidth.value = withTiming(100, { duration: 500 });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, questions.length]);

  useEffect(() => {
    if (isComplete && !saved) {
      setSaved(true);
      const score = correct;
      const passed = score >= PASS_MARK;
      const xp = passed ? REVIEW_XP_REWARD : Math.round(REVIEW_XP_REWARD * (score / questions.length));
      if (user) {
        completeReview(user.id, topicId ?? "", score, xp).catch(() => {});
      }
    }
  }, [isComplete]);

  const handleQuit = () => {
    router.back();
  };

  const currentQ = questions[currentIndex];
  const score = correct;
  const passed = score >= PASS_MARK;
  const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const xpAwarded = passed
    ? REVIEW_XP_REWARD
    : Math.round(REVIEW_XP_REWARD * (score / questions.length));

  if (!topic || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.quitBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{topic?.title ?? "Topic"} Review</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyEmoji}>🎯</Text>
          </View>
          <Text style={styles.emptyTitle}>Review coming soon</Text>
          <Text style={styles.emptyDesc}>
            {topic
              ? `The ${topic.title} review isn't available yet. Complete all lessons to unlock it.`
              : "This topic couldn't be found."}
          </Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={styles.emptyBtnWrap}>
            <LinearGradient
              colors={[COLORS.primary, "#8B5CF6"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.emptyBtn}
            >
              <Feather name="arrow-left" size={15} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Back to Topics</Text>
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
        <TouchableOpacity onPress={handleQuit} style={styles.quitBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={styles.reviewLabel}>TOPIC REVIEW</Text>
          <Text style={styles.topicName} numberOfLines={1}>{topic.title}</Text>
        </View>

        <Animated.View style={[styles.xpPill, xpStyle]}>
          <Text style={styles.xpEmoji}>⚡</Text>
          <Text style={styles.xpCount}>{correct * Math.floor(REVIEW_XP_REWARD / questions.length)}</Text>
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
              {currentQ.type === "multiple_choice" ? "🎯 Multiple Choice" : "✏️ Fill in"}
            </Text>
          </View>
          <Text style={styles.stepCounter}>{currentIndex + 1} / {questions.length}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isComplete ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <ReviewComplete
              score={score}
              total={questions.length}
              accuracy={accuracy}
              passed={passed}
              mistakes={mistakes}
              xpAwarded={xpAwarded}
              topicColor={topic.color}
              topicTitle={topic.title}
              onContinue={() => router.back()}
              onRetry={() => {
                setCurrentIndex(0);
                setCorrect(0);
                setMistakes(0);
                setIsComplete(false);
                setSaved(false);
                startTime.current = Date.now();
                progressWidth.value = withTiming(0, { duration: 300 });
              }}
            />
          </Animated.View>
        ) : (
          <Animated.View
            key={currentIndex}
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ReviewComplete ───────────────────────────────────────────────────────────

interface ReviewCompleteProps {
  score: number;
  total: number;
  accuracy: number;
  passed: boolean;
  mistakes: number;
  xpAwarded: number;
  topicColor: string;
  topicTitle: string;
  onContinue: () => void;
  onRetry: () => void;
}

const ReviewComplete: React.FC<ReviewCompleteProps> = ({
  score, total, accuracy, passed, mistakes, xpAwarded,
  topicColor, topicTitle, onContinue, onRetry,
}) => {
  const badgeScale = useSharedValue(0);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));

  useEffect(() => {
    badgeScale.value = withSpring(1, { stiffness: 200, damping: 12 });
  }, []);

  const emoji = passed ? "🏆" : score >= 5 ? "💪" : "📖";
  const message = passed
    ? "Excellent! You've mastered this topic!"
    : score >= 5
    ? "Good effort! Review the lessons and try again."
    : "Keep practising — you'll get there!";

  return (
    <View style={styles.completeWrap}>
      {/* Badge */}
      <Animated.View style={badgeStyle}>
        <LinearGradient
          colors={passed ? [topicColor, COLORS.primary] : ["#94A3B8", "#64748B"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Text style={styles.badgeEmoji}>{emoji}</Text>
          {passed && (
            <View style={styles.badgeLabel}>
              <Feather name="award" size={13} color="#FFFFFF" />
              <Text style={styles.badgeLabelText}>Topic Badge!</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Title */}
      <View style={styles.completeTextArea}>
        <Text style={styles.completeTitle}>{passed ? "Review Passed!" : "Review Complete"}</Text>
        <Text style={styles.completeTopicName}>{topicTitle}</Text>
        <Text style={styles.completeMessage}>{message}</Text>
      </View>

      {/* XP badge */}
      <View style={[styles.xpBadge, { borderColor: passed ? "#FDE68A" : "#E2E8F0" }]}>
        <Text style={styles.xpBadgeEmoji}>⚡</Text>
        <Text style={styles.xpBadgeText}>+{xpAwarded} XP earned</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox emoji="✅" label="Correct" value={`${score}/${total}`} color="#16A34A" bg="#F0FDF4" border="#86EFAC" />
        <StatBox emoji="🎯" label="Accuracy" value={`${accuracy}%`} color={COLORS.primary} bg="#EDE9FF" border="#C4B5FD" />
        <StatBox emoji="❌" label="Mistakes" value={`${mistakes}`} color="#DC2626" bg="#FFF1F2" border="#FCA5A5" />
      </View>

      {/* Pass indicator */}
      <View style={[styles.passBanner, { backgroundColor: passed ? "#F0FDF4" : "#FFF1F2", borderColor: passed ? "#86EFAC" : "#FCA5A5" }]}>
        <Feather name={passed ? "check-circle" : "info"} size={16} color={passed ? "#16A34A" : "#DC2626"} />
        <Text style={[styles.passBannerText, { color: passed ? "#16A34A" : "#DC2626" }]}>
          {passed ? `Passed! Score: ${score}/${total} (pass mark: ${PASS_MARK}/${total})` : `Score: ${score}/${total} — Need ${PASS_MARK} to pass`}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.btns}>
        {!passed && (
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn} activeOpacity={0.85}>
            <Feather name="refresh-cw" size={16} color={COLORS.primary} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onContinue} activeOpacity={0.9} style={styles.continueWrap}>
          <LinearGradient
            colors={passed ? [topicColor, COLORS.primary] : [COLORS.primary, "#8B5CF6"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.continueBtn}
          >
            <Text style={styles.continueBtnText}>{passed ? "Finish ✓" : "Back to Topics"}</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  errorText: { fontSize: 15, color: "#6B7280", fontWeight: "600" },
  backBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { color: "#FFFFFF", fontWeight: "700" },
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
  reviewLabel: { fontSize: 10, fontWeight: "800", color: COLORS.primary, letterSpacing: 1 },
  topicName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  xpPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FEFCE8", borderWidth: 1.5, borderColor: "#FDE68A",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
  },
  xpEmoji: { fontSize: 12 },
  xpCount: { color: "#92400E", fontWeight: "900", fontSize: 13 },

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

  // Review complete
  completeWrap: { gap: 20, paddingTop: 8 },
  badge: {
    width: 120, height: 120, borderRadius: 60,
    alignSelf: "center", alignItems: "center", justifyContent: "center", gap: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  badgeEmoji: { fontSize: 52 },
  badgeLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeLabelText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },

  completeTextArea: { alignItems: "center", gap: 4 },
  completeTitle: { fontSize: 28, fontWeight: "900", color: "#111827", letterSpacing: -0.5 },
  completeTopicName: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  completeMessage: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },

  xpBadge: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center",
    backgroundColor: "#FEFCE8", borderWidth: 2, paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 99,
  },
  xpBadgeEmoji: { fontSize: 18 },
  xpBadgeText: { fontSize: 16, fontWeight: "900", color: "#92400E" },

  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1, alignItems: "center", gap: 4, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1.5,
  },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: "#6B7280", fontWeight: "600", textTransform: "uppercase" },

  passBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1.5,
  },
  passBannerText: { fontSize: 13, fontWeight: "700", flex: 1 },

  btns: { gap: 10 },
  retryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 2, borderColor: COLORS.primary, borderRadius: 16, paddingVertical: 14,
  },
  retryBtnText: { color: COLORS.primary, fontWeight: "800", fontSize: 15 },
  continueWrap: {
    borderRadius: 16, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 7,
  },
  continueBtn: { paddingVertical: 16, alignItems: "center" },
  continueBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});
