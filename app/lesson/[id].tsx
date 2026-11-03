import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
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
import { QuizQuestion } from "../../src/components/quiz/QuizQuestion";
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

  // Synchronous gate — checked before any render or effect
  const allowed = canStartLesson(id);

  const {
    activeLesson, currentStepIndex, correctAnswers, mistakes,
    xpEarned, isComplete, showAIHelp, aiHelpContext,
    difficultyDelta, lastDifficultyEvent,
    startLesson, nextStep, recordCorrect, recordMistake, addXP,
    completeLesson, openAIHelp, closeAIHelp, resetLesson,
    clearDifficultyEvent, getCurrentStep,
  } = useLessonStore();

  // ── XP counter bounce ────────────────────────────────────────────────────
  const xpScale = useSharedValue(1);
  const xpStyle = useAnimatedStyle(() => ({ transform: [{ scale: xpScale.value }] }));

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/welcome");
      return;
    }

    if (!allowed) {
      router.replace("/(tabs)/learn");
      return;
    }

    const lesson = getLessonById(id);
    if (lesson) {
      startLesson(lesson, user?.skill_level ?? "beginner");
      recordLessonStarted(user?.id ?? "guest", lesson.id);
    } else {
      Alert.alert("Error", "Lesson not found");
      router.back();
    }
    return () => resetLesson();
  }, [id]);

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
      const qCount = activeLesson.steps?.filter((s) => s.type !== "explanation").length ?? 1;
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

  const totalSteps = activeLesson.steps?.length ?? 0;
  const questionSteps = activeLesson.steps?.filter((s) => s.type !== "explanation").length ?? 0;
  const isExplain = currentStep.type === "explanation";
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerBar}>
          {/* Quit button */}
          <TouchableOpacity
            onPress={handleQuit}
            style={styles.quitBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Exit lesson"
          >
            <Feather name="x" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* Segmented progress — one segment per step */}
          <View
            style={styles.segments}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 1, max: totalSteps, now: Math.min(currentStepIndex + 1, totalSteps) }}
          >
            {activeLesson.steps.map((_, i) => (
              <Segment key={i} filled={isComplete || i <= currentStepIndex} current={!isComplete && i === currentStepIndex} />
            ))}
          </View>

          {/* XP earned so far */}
          <Animated.View style={[styles.xpPill, xpStyle]}>
            <Text style={styles.xpEmoji}>⚡</Text>
            <Text style={styles.xpCount}>+{Math.max(0, xpEarned)} XP</Text>
          </Animated.View>
        </View>

        {/* Step type + counter */}
        {!isComplete && (
          <View style={styles.stepMeta}>
            <View style={styles.stepTypePill}>
              <Text style={styles.stepTypeText}>
                {isExplain ? "📖  Learn" : currentStep.type === "multiple_choice" ? "🎯  Question" : "✏️  Fill in"}
              </Text>
            </View>
            <View style={styles.metaRight}>
              {!isExplain && <DifficultyPill delta={difficultyDelta} />}
              <Text style={styles.stepCounter}>{currentStepIndex + 1} / {totalSteps}</Text>
            </View>
          </View>
        )}
      </View>

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
        ) : isExplain ? (
          <Animated.View
            key={currentStepIndex}
            entering={SlideInRight.duration(280).springify()}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContainer}
          >
            <ExplanationCard
              content={currentStep.content as ExplanationContent}
              topicTitle={topicTitle}
              lessonNumber={activeLesson.order_index}
            />
          </Animated.View>
        ) : (
          <QuizQuestion
            key={currentStepIndex}
            type={currentStep.type}
            content={currentStep.content as MultipleChoiceContent | FillBlankContent}
            onCorrect={handleCorrect}
            onMistake={handleMistake}
            onNext={handleNext}
            onAIHelp={() => openAIHelp((currentStep.content as MultipleChoiceContent).question)}
            hintsUsed={hintsUsed}
            onUseHint={handleUseHint}
            style={styles.stepContainer}
          />
        )}
      </ScrollView>

      {/* ── Sticky action bar (explanation steps) ────────────────────────────── */}
      {isExplain && !isComplete && (
        <View style={styles.footer}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [styles.gotItBase, pressed && styles.gotItBasePressed]}
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <LinearGradient
                colors={["#7C5CF7", "#4F46E5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gotItFace, pressed && styles.gotItFacePressed]}
              >
                <Text style={styles.gotItText}>{isLastStep ? "Finish" : "Got it"}</Text>
                <Text style={styles.gotItArrow}>{isLastStep ? "✓" : "→"}</Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      )}

      <AIHelpModal visible={showAIHelp} question={aiHelpContext} onClose={closeAIHelp} />

      {/* ── Difficulty shift toast ───────────────────────────────────────────── */}
      <DifficultyToast event={lastDifficultyEvent} onDone={clearDifficultyEvent} />
    </SafeAreaView>
  );
}

// ── Segment (header progress) ─────────────────────────────────────────────────

const Segment: React.FC<{ filled: boolean; current: boolean }> = ({ filled, current }) => {
  const glow = useSharedValue(0);

  useEffect(() => {
    if (current) {
      glow.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      glow.value = 0;
    }
  }, [current]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.25 }));

  if (!filled) return <View style={[styles.segment, styles.segmentEmpty]} />;
  return (
    <View style={[styles.segment, current && styles.segmentCurrent]}>
      <LinearGradient
        colors={["#7C5CF7", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {current && <Animated.View style={[StyleSheet.absoluteFill, styles.segmentGlow, glowStyle]} />}
    </View>
  );
};

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
  safe: { flex: 1, backgroundColor: "#F7F6FE" },

  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingEmoji: { fontSize: 48 },
  loadingText: { fontSize: 16, color: "#6B7280", fontWeight: "600" },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(237,233,254,0.8)",
    backgroundColor: "#F7F6FE",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  // Segmented progress
  segments: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 2 },
  segment: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  segmentEmpty: { backgroundColor: "#EDE9FE" },
  segmentCurrent: {
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentGlow: { backgroundColor: "#FFFFFF" },

  // XP pill
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  xpEmoji: { fontSize: 13 },
  xpCount: { color: "#B45309", fontWeight: "700", fontSize: 12 },

  // Step meta
  stepMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingHorizontal: 2,
  },
  stepTypePill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  stepTypeText: { fontSize: 12, fontWeight: "600", color: "#6C5CE7" },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepCounter: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
  },

  // Body
  body: { flex: 1, paddingHorizontal: 16 },
  bodyContent: { paddingTop: 12, paddingBottom: 24, gap: 16 },
  stepContainer: { gap: 16 },

  // Sticky footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: "#EDE9FE",
  },
  // 3D button: a darker base shows below the face; pressing sinks the face.
  gotItBase: {
    borderRadius: 16,
    backgroundColor: "#5843D4",
    paddingBottom: 4,
  },
  gotItBasePressed: { paddingBottom: 1, marginTop: 3 },
  gotItFace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  gotItFacePressed: { opacity: 0.95 },
  gotItText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16, letterSpacing: 0.4 },
  gotItArrow: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },
});
