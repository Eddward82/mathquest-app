import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
} from "react-native-reanimated";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { COLORS, BORDER_RADIUS } from "../src/constants/theme";
import { useAuthStore } from "../src/store/authStore";
import { SkillLevel, UserGoal, TopicCategory } from "../src/types";

const { width } = Dimensions.get("window");

// ─── Step 1: Skill level ─────────────────────────────────────────────────────

const SKILL_LEVELS: {
  level: SkillLevel;
  emoji: string;
  title: string;
  desc: string;
  topics: string;
  gradient: [string, string];
}[] = [
  {
    level: "beginner",
    emoji: "🌱",
    title: "Beginner",
    desc: "I'm new to maths or need to brush up on the basics.",
    topics: "Arithmetic, basic Algebra",
    gradient: ["#6C63FF", "#8B5CF6"],
  },
  {
    level: "intermediate",
    emoji: "⚡",
    title: "Intermediate",
    desc: "I'm comfortable with the basics and want to go further.",
    topics: "Algebra, Geometry, Word Problems",
    gradient: ["#FF6B35", "#F97316"],
  },
  {
    level: "advanced",
    emoji: "🚀",
    title: "Advanced",
    desc: "I want exam-level challenge and harder problems.",
    topics: "Advanced Algebra, Complex Geometry",
    gradient: ["#10B981", "#059669"],
  },
];

// ─── Step 2: Goal ────────────────────────────────────────────────────────────

const GOALS: { goal: UserGoal; emoji: string; title: string; desc: string }[] = [
  { goal: "pass_exams", emoji: "🎓", title: "Pass my exams", desc: "Preparing for school or standardised tests" },
  { goal: "improve_grades", emoji: "📈", title: "Improve my grades", desc: "Get better marks in maths class" },
  { goal: "just_for_fun", emoji: "🎮", title: "Just for fun", desc: "I enjoy learning and solving puzzles" },
  { goal: "teach_others", emoji: "👩‍🏫", title: "Teach others", desc: "Help my kids or students learn maths" },
];

// ─── Step 3: Daily target ────────────────────────────────────────────────────

const DAILY_TARGETS: { minutes: number; label: string; desc: string; emoji: string }[] = [
  { minutes: 5,  label: "5 min",  desc: "Just a quick daily habit",   emoji: "🌙" },
  { minutes: 10, label: "10 min", desc: "Steady & consistent",         emoji: "⚡" },
  { minutes: 15, label: "15 min", desc: "Serious about improving",     emoji: "🔥" },
  { minutes: 30, label: "30 min", desc: "All in — maximum progress",   emoji: "🚀" },
];

// ─── Step 4: Focus topics ────────────────────────────────────────────────────

const FOCUS_TOPICS: { id: TopicCategory; emoji: string; label: string }[] = [
  { id: "arithmetic",    emoji: "🔢", label: "Arithmetic" },
  { id: "algebra",       emoji: "🔣", label: "Algebra" },
  { id: "geometry",      emoji: "📐", label: "Geometry" },
  { id: "fractions",     emoji: "🍕", label: "Fractions" },
  { id: "percentages",   emoji: "💯", label: "Percentages" },
  { id: "number_theory", emoji: "🔑", label: "Number Theory" },
  { id: "statistics",    emoji: "📊", label: "Statistics" },
  { id: "probability",   emoji: "🎲", label: "Probability" },
  { id: "measurement",   emoji: "📏", label: "Measurement" },
  { id: "word_problems", emoji: "📝", label: "Word Problems" },
  { id: "ratio",         emoji: "⚖️", label: "Ratio & Proportion" },
];

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { updateSkillLevel, updateOnboarding, user } = useAuthStore();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const [skillLevel, setSkillLevel] = useState<SkillLevel>("beginner");
  const [goal, setGoal] = useState<UserGoal>("pass_exams");
  const [dailyTarget, setDailyTarget] = useState(10);
  const [focusTopics, setFocusTopics] = useState<TopicCategory[]>([]);

  const TOTAL_STEPS = 4;

  const goNext = () => {
    setDirection("forward");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection("back");
    setStep((s) => s - 1);
  };

  const toggleTopic = (id: TopicCategory) => {
    setFocusTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    await updateSkillLevel(skillLevel);
    await updateOnboarding({ goal, daily_target_minutes: dailyTarget, focus_topics: focusTopics });
    router.replace("/(tabs)/learn?welcome=1");
  };

  const enterAnim = direction === "forward" ? FadeInRight.duration(260).springify() : FadeInLeft.duration(260).springify();
  const exitAnim  = direction === "forward" ? FadeOutLeft.duration(200) : FadeOutRight.duration(200);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {step > 0 && (
          <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="arrow-left" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        <View style={[styles.progressTrack, step === 0 && { marginLeft: 44 }]}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, i <= step && styles.progressSegmentActive]}
            />
          ))}
        </View>
        <Text style={styles.stepCount}>{step + 1}/{TOTAL_STEPS}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.greeting}>Hi {user?.username ?? "there"}! 👋</Text>

        {step === 0 && (
          <Animated.View key="step0" entering={enterAnim} exiting={exitAnim} style={styles.stepWrap}>
            <Text style={styles.title}>What's your skill level?</Text>
            <Text style={styles.subtitle}>We'll personalise your learning path.</Text>
            <View style={styles.cards}>
              {SKILL_LEVELS.map((item) => (
                <SkillCard
                  key={item.level}
                  {...item}
                  isSelected={skillLevel === item.level}
                  onSelect={() => setSkillLevel(item.level)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View key="step1" entering={enterAnim} exiting={exitAnim} style={styles.stepWrap}>
            <Text style={styles.title}>What's your goal?</Text>
            <Text style={styles.subtitle}>This helps us tailor your experience.</Text>
            <View style={styles.cards}>
              {GOALS.map((item) => (
                <SelectCard
                  key={item.goal}
                  emoji={item.emoji}
                  title={item.title}
                  desc={item.desc}
                  isSelected={goal === item.goal}
                  onSelect={() => setGoal(item.goal)}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View key="step2" entering={enterAnim} exiting={exitAnim} style={styles.stepWrap}>
            <Text style={styles.title}>Daily learning target</Text>
            <Text style={styles.subtitle}>How many minutes can you spare each day?</Text>
            <View style={styles.cards}>
              {DAILY_TARGETS.map((item) => (
                <SelectCard
                  key={item.minutes}
                  emoji={item.emoji}
                  title={item.label}
                  desc={item.desc}
                  isSelected={dailyTarget === item.minutes}
                  onSelect={() => setDailyTarget(item.minutes)}
                  accent={["#6C63FF", "#8B5CF6"]}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View key="step3" entering={enterAnim} exiting={exitAnim} style={styles.stepWrap}>
            <Text style={styles.title}>Pick your focus topics</Text>
            <Text style={styles.subtitle}>Select the areas you want to improve most. (Optional — skip to learn everything)</Text>
            <View style={styles.topicGrid}>
              {FOCUS_TOPICS.map((item) => (
                <TopicChip
                  key={item.id}
                  emoji={item.emoji}
                  label={item.label}
                  isSelected={focusTopics.includes(item.id)}
                  onToggle={() => toggleTopic(item.id)}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* CTA button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={step < TOTAL_STEPS - 1 ? goNext : handleFinish}
          activeOpacity={0.9}
          style={styles.ctaWrap}
        >
          <LinearGradient
            colors={[COLORS.primary, "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              {step < TOTAL_STEPS - 1 ? "Continue →" : "Start Learning! 🚀"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {step === TOTAL_STEPS - 1 && (
          <Text style={styles.skipNote}>You can update these anytime in your profile</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── SkillCard ────────────────────────────────────────────────────────────────

const SkillCard: React.FC<{
  emoji: string; title: string; desc: string; topics: string;
  gradient: [string, string]; isSelected: boolean; onSelect: () => void;
}> = ({ emoji, title, desc, topics, gradient, isSelected, onSelect }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.97, { stiffness: 400 }, () => {
      scale.value = withSpring(1, { stiffness: 400 });
    });
    onSelect();
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}
        style={[styles.card, isSelected && { borderColor: gradient[0], borderWidth: 2.5 }]}>
        <LinearGradient
          colors={isSelected ? gradient : ["#F8F9FF", "#F1F5F9"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          <View style={styles.cardIconBox}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, isSelected && styles.cardTitleLight]}>{title}</Text>
            <Text style={[styles.cardDesc, isSelected && styles.cardDescLight]}>{desc}</Text>
            <Text style={[styles.cardTopics, { color: isSelected ? "rgba(255,255,255,0.7)" : COLORS.primary }]}>
              📚 {topics}
            </Text>
          </View>
          {isSelected && (
            <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── SelectCard (generic for goal + daily target) ────────────────────────────

const SelectCard: React.FC<{
  emoji: string; title: string; desc: string;
  isSelected: boolean; onSelect: () => void;
  accent?: [string, string];
}> = ({ emoji, title, desc, isSelected, onSelect, accent = ["#6C63FF", "#8B5CF6"] }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.97, { stiffness: 400 }, () => {
      scale.value = withSpring(1, { stiffness: 400 });
    });
    onSelect();
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}
        style={[styles.card, isSelected && { borderColor: accent[0], borderWidth: 2.5 }]}>
        <LinearGradient
          colors={isSelected ? accent : ["#F8F9FF", "#F1F5F9"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.cardInner}
        >
          <View style={styles.cardIconBox}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, isSelected && styles.cardTitleLight]}>{title}</Text>
            <Text style={[styles.cardDesc, isSelected && styles.cardDescLight]}>{desc}</Text>
          </View>
          {isSelected && (
            <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── TopicChip ────────────────────────────────────────────────────────────────

const TopicChip: React.FC<{
  emoji: string; label: string; isSelected: boolean; onToggle: () => void;
}> = ({ emoji, label, isSelected, onToggle }) => (
  <TouchableOpacity
    onPress={onToggle}
    activeOpacity={0.8}
    style={[styles.chip, isSelected && styles.chipSelected]}
  >
    <Text style={styles.chipEmoji}>{emoji}</Text>
    <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{label}</Text>
    {isSelected && <Feather name="check" size={13} color={COLORS.primary} />}
  </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  progressTrack: { flex: 1, flexDirection: "row", gap: 5 },
  progressSegment: {
    flex: 1, height: 6, borderRadius: 3, backgroundColor: "#E2E8F0",
  },
  progressSegmentActive: { backgroundColor: COLORS.primary },
  stepCount: { fontSize: 12, fontWeight: "700", color: "#9CA3AF", width: 32, textAlign: "right" },

  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  greeting: { fontSize: 15, color: "#6B7280", fontWeight: "500", marginBottom: 2 },

  stepWrap: { gap: 4 },
  title: { fontSize: 24, fontWeight: "900", color: "#1F2937", marginTop: 4 },
  subtitle: { fontSize: 13, color: "#6B7280", lineHeight: 19, marginBottom: 16 },

  cards: { gap: 10 },

  card: {
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5, borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardInner: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  cardIconBox: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center",
  },
  cardEmoji: { fontSize: 24 },
  cardContent: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
  cardTitleLight: { color: "#FFFFFF" },
  cardDesc: { fontSize: 12, color: "#6B7280", lineHeight: 17 },
  cardDescLight: { color: "rgba(255,255,255,0.82)" },
  cardTopics: { fontSize: 11, fontWeight: "600", marginTop: 3 },
  check: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center",
  },
  checkText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },

  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 99, borderWidth: 1.5, borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: "#EEF2FF" },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: "700", color: "#374151" },
  chipLabelSelected: { color: COLORS.primary },

  footer: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8, gap: 10 },
  ctaWrap: {
    borderRadius: 18, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  cta: { paddingVertical: 17, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontWeight: "800", fontSize: 17, letterSpacing: 0.3 },
  skipNote: { textAlign: "center", fontSize: 12, color: "#9CA3AF" },
});
