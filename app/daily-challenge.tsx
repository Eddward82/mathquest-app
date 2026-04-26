import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSequence, withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "../src/store/authStore";
import { useProgressStore } from "../src/store/progressStore";
import { getTodayChallenge, isChallengeCompleted, DailyChallenge } from "../src/data/dailyChallenges";
import { MultipleChoiceContent, FillBlankContent } from "../src/types";
import { MultipleChoiceQuestion } from "../src/components/lesson/MultipleChoiceQuestion";
import { FillBlankQuestion } from "../src/components/lesson/FillBlankQuestion";
import { AIHelpModal } from "../src/components/lesson/AIHelpModal";
import { COLORS, BORDER_RADIUS } from "../src/constants/theme";

export default function DailyChallengeScreen() {
  const { user } = useAuthStore();
  const { dailyChallengeCompletedDate, completeDailyChallenge } = useProgressStore();
  const challenge = getTodayChallenge();
  const alreadyDone = isChallengeCompleted(dailyChallengeCompletedDate);

  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiQuestion, setAIQuestion] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const xpScale = useSharedValue(1);
  const xpStyle = useAnimatedStyle(() => ({ transform: [{ scale: xpScale.value }] }));

  const handleCorrect = useCallback(() => {
    setIsCorrect(true);
    setAnswered(true);
    xpScale.value = withSequence(
      withSpring(1.4, { stiffness: 500, damping: 12 }),
      withSpring(1, { stiffness: 400, damping: 14 })
    );
  }, []);

  const handleMistake = useCallback(() => {
    setIsCorrect(false);
    setAnswered(true);
  }, []);

  const handleNext = useCallback(async () => {
    if (isCorrect && !alreadyDone) {
      await completeDailyChallenge(user?.id ?? "guest", challenge.xpReward);
    }
    router.back();
  }, [isCorrect, alreadyDone, challenge]);

  const handleAIHelp = useCallback(() => {
    const q = challenge.questionType === "multiple_choice"
      ? (challenge.question as MultipleChoiceContent).question
      : (challenge.question as FillBlankContent).question;
    setAIQuestion(q);
    setShowAI(true);
  }, [challenge]);

  const handleUseHint = useCallback((cost: number) => {
    setHintsUsed((h) => h + 1);
  }, []);

  const diffColor =
    challenge.difficulty === "easy" ? "#16A34A" :
    challenge.difficulty === "medium" ? "#D97706" : "#DC2626";
  const diffBg =
    challenge.difficulty === "easy" ? "#F0FDF4" :
    challenge.difficulty === "medium" ? "#FFFBEB" : "#FFF1F2";

  if (alreadyDone) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Challenge</Text>
          <View style={{ width: 36 }} />
        </View>
        <Animated.View entering={FadeIn.duration(400)} style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.doneTitle}>Already completed!</Text>
          <Text style={styles.doneSub}>You've done today's challenge. Come back tomorrow for a new one.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.doneBtn} activeOpacity={0.85}>
            <LinearGradient colors={[COLORS.primary, "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.doneBtnGrad}>
              <Text style={styles.doneBtnText}>Back to Learning</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AIHelpModal visible={showAI} question={aiQuestion} onClose={() => setShowAI(false)} />

      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={20} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Challenge</Text>
        {/* XP reward pill */}
        <Animated.View style={[styles.xpPill, xpStyle]}>
          <Text style={styles.xpEmoji}>⚡</Text>
          <Text style={styles.xpCount}>+{challenge.xpReward}</Text>
        </Animated.View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Challenge card */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <LinearGradient
            colors={["#4C35DE", "#6C63FF", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroOrb1} />
            <View style={styles.heroOrb2} />
            <View style={styles.heroRow}>
              <Text style={styles.heroEmoji}>{challenge.topicEmoji}</Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroLabel}>TODAY'S CHALLENGE</Text>
                <Text style={styles.heroTitle}>{challenge.title}</Text>
                <Text style={styles.heroTopic}>{challenge.topic}</Text>
              </View>
            </View>
            <View style={styles.heroFooter}>
              <View style={[styles.diffPill, { backgroundColor: diffBg }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>
                  {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                </Text>
              </View>
              <View style={styles.xpHero}>
                <Feather name="zap" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.xpHeroText}>{challenge.xpReward} XP bonus</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Question */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          {challenge.questionType === "multiple_choice" ? (
            <MultipleChoiceQuestion
              content={challenge.question as MultipleChoiceContent}
              onCorrect={handleCorrect}
              onMistake={handleMistake}
              onNext={handleNext}
              onAIHelp={handleAIHelp}
              hintsUsed={hintsUsed}
              onUseHint={handleUseHint}
            />
          ) : (
            <FillBlankQuestion
              content={challenge.question as FillBlankContent}
              onCorrect={handleCorrect}
              onMistake={handleMistake}
              onNext={handleNext}
              onAIHelp={handleAIHelp}
              hintsUsed={hintsUsed}
              onUseHint={handleUseHint}
            />
          )}
        </Animated.View>

        {/* Result banner */}
        {answered && (
          <Animated.View entering={FadeInDown.springify()} style={[styles.resultBanner, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
            <Text style={styles.resultEmoji}>{isCorrect ? "🎉" : "💪"}</Text>
            <View style={styles.resultText}>
              <Text style={[styles.resultTitle, { color: isCorrect ? "#166534" : "#991B1B" }]}>
                {isCorrect ? `+${challenge.xpReward} XP earned!` : "Not quite — keep practising!"}
              </Text>
              <Text style={[styles.resultSub, { color: isCorrect ? "#16A34A" : "#DC2626" }]}>
                {isCorrect ? "Come back tomorrow for another challenge." : "Try the regular lessons to build this skill."}
              </Text>
            </View>
          </Animated.View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },

  headerBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: "#F0EDFF",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F4F5FF", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  xpPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FEFCE8", borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1.5, borderColor: "#FDE68A",
  },
  xpEmoji: { fontSize: 13 },
  xpCount: { fontSize: 13, fontWeight: "900", color: "#92400E" },

  content: { padding: 16, gap: 16, paddingBottom: 40 },

  // Hero card
  heroCard: {
    borderRadius: 24, padding: 20, gap: 12, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  heroOrb1: {
    position: "absolute", top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  heroOrb2: {
    position: "absolute", bottom: -20, left: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroEmoji: { fontSize: 40 },
  heroMeta: { flex: 1, gap: 2 },
  heroLabel: { fontSize: 10, fontWeight: "800", color: "rgba(255,255,255,0.65)", letterSpacing: 1 },
  heroTitle: { fontSize: 20, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.4 },
  heroTopic: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  heroFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  diffPill: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  diffText: { fontSize: 12, fontWeight: "800" },
  xpHero: { flexDirection: "row", alignItems: "center", gap: 5 },
  xpHeroText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)" },

  // Result banner
  resultBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, padding: 16, borderWidth: 1.5,
  },
  resultCorrect: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  resultWrong: { backgroundColor: "#FFF1F2", borderColor: "#FCA5A5" },
  resultEmoji: { fontSize: 28 },
  resultText: { flex: 1, gap: 3 },
  resultTitle: { fontSize: 15, fontWeight: "800" },
  resultSub: { fontSize: 13, fontWeight: "500", lineHeight: 18 },

  // Done state
  doneContainer: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 32, gap: 16,
  },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontSize: 24, fontWeight: "900", color: "#111827", textAlign: "center" },
  doneSub: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  doneBtn: { borderRadius: 16, overflow: "hidden", marginTop: 8, width: "100%" },
  doneBtnGrad: { paddingVertical: 16, alignItems: "center" },
  doneBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
});
