import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useLessonStore, DifficultyDelta } from "../../src/store/lessonStore";
import { useProgressStore } from "../../src/store/progressStore";
import { useAuthStore } from "../../src/store/authStore";
import { useSubscriptionStore } from "../../src/store/subscriptionStore";
import { getLessonById } from "../../src/data/lessons";
import { COLORS, BORDER_RADIUS } from "../../src/constants/theme";
import { ExplanationCard } from "../../src/components/lesson/ExplanationCard";
import { MultipleChoiceQuestion } from "../../src/components/lesson/MultipleChoiceQuestion";
import { FillBlankQuestion } from "../../src/components/lesson/FillBlankQuestion";
import { LessonComplete } from "../../src/components/lesson/LessonComplete";
import { AIHelpModal } from "../../src/components/lesson/AIHelpModal";
import { DifficultyToast } from "../../src/components/lesson/DifficultyToast";
import {
  ExplanationContent,
  MultipleChoiceContent,
  FillBlankContent,
} from "../../src/types";

export default function LessonScreen() {
  const { id, topicTitle } = useLocalSearchParams<{ id: string; topicTitle: string }>();
  const { user } = useAuthStore();
  const { completeLesson: saveProgress, checkAndUnlockAchievements } = useProgressStore();
  const lessonStartTime = React.useRef(Date.now());
  const { canStartLesson, recordLessonStarted, isPremium } = useSubscriptionStore();

  const {
    activeLesson, currentStepIndex, correctAnswers, mistakes,
    xpEarned, isComplete, showAIHelp, aiHelpContext,
    difficultyDelta, lastDifficultyEvent,
    startLesson, nextStep, recordCorrect, recordMistake, addXP,
    completeLesson, openAIHelp, closeAIHelp, resetLesson,
    clearDifficultyEvent, getCurrentStep, getProgress,
  } = useLessonStore();

  // ── Animated progress bar ────────────────────────────────────────────────
  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` }));

  // ── XP counter bounce ────────────────────────────────────────────────────
  const xpScale = useSharedValue(1);
  const xpStyle = useAnimatedStyle(() => ({ transform: [{ scale: xpScale.value }] }));

  useEffect(() => {
    // Gate: if limit hit (e.g. direct navigation), send back to learn
    if (!canStartLesson()) {
      router.replace("/(tabs)/learn");
      return;
    }

    const lesson = getLessonById(id);
    if (lesson) {
      startLesson(lesson, user?.skill_level ?? "beginner");
      recordLessonStarted(user?.id ?? "guest");
    } else {
      Alert.alert("Error", "Lesson not found");
      router.back();
    }
    return () => resetLesson();
  }, [id]);

  useEffect(() => {
    progressWidth.value = withTiming(getProgress(), { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [currentStepIndex]);

  // Bounce XP display when XP changes
  useEffect(() => {
    if (xpEarned > 0) {
      xpScale.value = withSequence(
        withSpring(1.4, { stiffness: 500, damping: 12 }),
        withSpring(1, { stiffness: 400, damping: 14 })
      );
    }
  }, [xpEarned]);

  const currentStep = getCurrentStep();

  // ── Hints ────────────────────────────────────────────────────────────────────
  const [hintsUsed, setHintsUsed] = React.useState(0);

  // Reset hints when moving to a new step
  React.useEffect(() => { setHintsUsed(0); }, [currentStepIndex]);

  const handleUseHint = useCallback((xpCost: number) => {
    setHintsUsed((h) => h + 1);
    // Deduct XP — use negative addXP (clamp to 0 in display)
    addXP(-xpCost);
  }, [addXP]);

  const handleCorrect = useCallback(() => {
    recordCorrect();
    if (activeLesson) {
      const qCount = activeLesson.steps.filter((s) => s.type !== "explanation").length;
      addXP(Math.floor(activeLesson.xp_reward / Math.max(qCount, 1)));
    }
  }, [activeLesson]);

  const handleMistake = useCallback(() => recordMistake(), []);

  const handleNext = useCallback(() => {
    if (!activeLesson) return;
    if (currentStepIndex === activeLesson.steps.length - 1) completeLesson();
    else nextStep();
  }, [activeLesson, currentStepIndex]);

  const handleComplete = () => {
    // Navigate immediately — don't block on Firestore writes
    router.back();

    if (activeLesson && user) {
      const elapsedMs = Date.now() - lessonStartTime.current;
      const { unlockAchievement } = useProgressStore.getState();

      saveProgress(user.id, activeLesson.id, xpEarned, mistakes, difficultyDelta)
        .then(() => {
          const jobs: Promise<void>[] = [checkAndUnlockAchievements(user.id)];
          if (mistakes === 0) jobs.push(unlockAchievement(user.id, "ach_perfect_score"));
          if (elapsedMs < 2 * 60 * 1000) jobs.push(unlockAchievement(user.id, "ach_speed_demon"));
          return Promise.all(jobs);
        })
        .catch(() => {
          // Silently ignore — progress will sync next load
        });
    }
  };

  const handleQuit = () => {
    Alert.alert("Quit Lesson?", "Your progress in this lesson won't be saved.", [
      { text: "Keep Going", style: "cancel" },
      { text: "Quit", style: "destructive", onPress: () => router.back() },
    ]);
  };

  if (!activeLesson || !currentStep) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingScreen}>
          <Text style={styles.loadingEmoji}>📖</Text>
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalSteps = activeLesson.steps.length;
  const questionSteps = activeLesson.steps.filter((s) => s.type !== "explanation").length;
  const isExplain = currentStep.type === "explanation";
  const stepDots = activeLesson.steps.map((s, i) => ({ type: s.type, isCurrent: i === currentStepIndex, isDone: i < currentStepIndex }));

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        {/* Quit button */}
        <TouchableOpacity onPress={handleQuit} style={styles.quitBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Segmented progress dots */}
        <View style={styles.dotsRow}>
          {stepDots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                dot.isDone && styles.dotDone,
                dot.isCurrent && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* XP pill */}
        <Animated.View style={[styles.xpPill, xpStyle]}>
          <Text style={styles.xpEmoji}>⚡</Text>
          <Text style={styles.xpCount}>{Math.max(0, xpEarned)}</Text>
        </Animated.View>
      </View>

      {/* ── Smooth progress bar ──────────────────────────────────────────────── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, progressStyle]}>
          <LinearGradient
            colors={["#818CF8", COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.progressGlow} />
        </Animated.View>
      </View>

      {/* ── Step meta ────────────────────────────────────────────────────────── */}
      {!isComplete && (
        <View style={styles.stepMeta}>
          <View style={styles.stepTypePill}>
            <Text style={styles.stepTypeText}>
              {isExplain ? "📖 Learn" : currentStep.type === "multiple_choice" ? "🎯 Question" : "✏️ Fill in"}
            </Text>
          </View>
          <View style={styles.metaRight}>
            {!isExplain && (
              <DifficultyPill delta={difficultyDelta} />
            )}
            <Text style={styles.stepCounter}>{currentStepIndex + 1} / {totalSteps}</Text>
          </View>
        </View>
      )}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isComplete ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
            <LessonComplete
              xpEarned={xpEarned}
              correctAnswers={correctAnswers}
              totalQuestions={questionSteps}
              mistakes={mistakes}
              onContinue={handleComplete}
            />
          </Animated.View>
        ) : (
          <Animated.View
            key={currentStepIndex}
            entering={SlideInRight.duration(280).springify()}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            {isExplain ? (
              <>
                <ExplanationCard content={currentStep.content as ExplanationContent} />
                <TouchableOpacity onPress={() => nextStep()} style={styles.gotItBtn} activeOpacity={0.9}>
                  <LinearGradient
                    colors={[COLORS.primary, "#8B5CF6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gotItGradient}
                  >
                    <Text style={styles.gotItText}>
                      {currentStepIndex === totalSteps - 1 ? "Finish ✓" : "Got it →"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : currentStep.type === "multiple_choice" ? (
              <MultipleChoiceQuestion
                content={currentStep.content as MultipleChoiceContent}
                onCorrect={handleCorrect}
                onMistake={handleMistake}
                onNext={handleNext}
                onAIHelp={() => openAIHelp((currentStep.content as MultipleChoiceContent).question)}
                hintsUsed={hintsUsed}
                onUseHint={handleUseHint}
              />
            ) : (
              <FillBlankQuestion
                content={currentStep.content as FillBlankContent}
                onCorrect={handleCorrect}
                onMistake={handleMistake}
                onNext={handleNext}
                onAIHelp={() => openAIHelp((currentStep.content as FillBlankContent).question)}
                hintsUsed={hintsUsed}
                onUseHint={handleUseHint}
              />
            )}
          </Animated.View>
        )}
      </ScrollView>

      <AIHelpModal visible={showAIHelp} question={aiHelpContext} onClose={closeAIHelp} />

      {/* ── Difficulty shift toast ───────────────────────────────────────────── */}
      <DifficultyToast event={lastDifficultyEvent} onDone={clearDifficultyEvent} />
    </SafeAreaView>
  );
}

// ── DifficultyPill ────────────────────────────────────────────────────────────

const PILL_CONFIG: Record<DifficultyDelta, { label: string; bg: string; color: string }> = {
  [-1]: { label: "Easier", bg: "#FEF3C7", color: "#92400E" },
  [0]:  { label: "Normal", bg: "#EDE9FF", color: COLORS.primary },
  [1]:  { label: "Harder", bg: "#FFF1F2", color: "#DC2626" },
};

const DifficultyPill: React.FC<{ delta: DifficultyDelta }> = ({ delta }) => {
  const cfg = PILL_CONFIG[delta];
  const icon = delta === 1 ? "trending-up" : delta === -1 ? "trending-down" : "minus";
  return (
    <View style={[diffPillStyles.pill, { backgroundColor: cfg.bg }]}>
      <Feather name={icon} size={11} color={cfg.color} />
      <Text style={[diffPillStyles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const diffPillStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  label: { fontSize: 11, fontWeight: "800" },
});

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },

  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingEmoji: { fontSize: 48 },
  loadingText: { fontSize: 16, color: "#6B7280", fontWeight: "600" },

  // Header bar
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 8 : 4,
    paddingBottom: 12,
    gap: 12,
  },
  quitBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Segmented dots
  dotsRow: { flex: 1, flexDirection: "row", gap: 4, alignItems: "center" },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
  },
  dotDone: { backgroundColor: COLORS.primary },
  dotActive: {
    backgroundColor: COLORS.primary,
    opacity: 0.5,
  },

  // XP pill
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEFCE8",
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 99,
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  xpEmoji: { fontSize: 13 },
  xpCount: { color: "#92400E", fontWeight: "900", fontSize: 14 },

  // Progress bar
  progressTrack: {
    marginHorizontal: 16,
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    overflow: "hidden",
    minWidth: 8,
  },
  progressGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 12,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 99,
  },

  // Step meta
  stepMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  stepTypePill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepTypeText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepCounter: { fontSize: 12, fontWeight: "700", color: "#9CA3AF" },

  // Body
  body: { flex: 1, paddingHorizontal: 16 },
  bodyContent: { paddingTop: 8, paddingBottom: 32, gap: 16 },
  stepContainer: { gap: 16 },

  // Got it button
  gotItBtn: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  gotItGradient: { paddingVertical: 17, alignItems: "center" },
  gotItText: { color: "#FFFFFF", fontWeight: "800", fontSize: 17, letterSpacing: 0.3 },
});
