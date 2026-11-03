import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { useAuthStore } from "../../src/store/authStore";
import { useProgressStore } from "../../src/store/progressStore";
import {
  COLORS,
  LEVEL_NAMES,
  XP_PER_LEVEL,
} from "../../src/constants/theme";
import { TOPICS } from "../../src/data/lessons";
import { getTodayChallenge, isChallengeCompleted } from "../../src/data/dailyChallenges";

const { width } = Dimensions.get("window");

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const INK = "#0F172A";
const MUTED = "#64748B";
const FAINT = "#94A3B8";
const LINE = "#E2E8F0";

export default function HomeScreen() {
  const { user } = useAuthStore();
  const {
    totalXP,
    currentLevel,
    currentStreak,
    lessonsCompleted,
    loadProgress,
    topics,
    completedLessonIds,
    dailyChallengeCompletedDate,
  } = useProgressStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const xpInLevel = totalXP % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100;
  const xpBarWidth = useSharedValue(0);
  const xpBarStyle = useAnimatedStyle(() => ({ width: `${xpBarWidth.value}%` }));

  // Streak flame pulse
  const flamePulse = useSharedValue(1);

  useEffect(() => {
    if (user) loadProgress(user.id);
  }, [user]);

  useEffect(() => {
    xpBarWidth.value = withDelay(600, withTiming(xpPct, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    if (currentStreak > 0) {
      flamePulse.value = withRepeat(
        withSequence(withSpring(1.15, { stiffness: 80 }), withSpring(1, { stiffness: 80 })),
        -1, true
      );
    }
  }, [xpPct, currentStreak]);

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: flamePulse.value }] }));

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) await loadProgress(user.id);
    setRefreshing(false);
  };

  const nextLesson = topics.flatMap((t) => t.lessons).find((l) => !l.is_completed && !l.is_locked);
  const nextTopic = nextLesson ? topics.find((t) => t.lessons.some((l) => l.id === nextLesson.id)) : null;

  const challenge = getTodayChallenge();
  const challengeDone = isChallengeCompleted(dailyChallengeCompletedDate);

  const name = user?.username ?? "Learner";
  const streakLabel = `${currentStreak} ${currentStreak === 1 ? "DAY" : "DAYS"}`;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={["#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.username} numberOfLines={1}>{name} 👋</Text>
            </View>
          </View>

          <Animated.View style={currentStreak > 0 ? flameStyle : undefined}>
            <View style={[styles.streakPill, currentStreak === 0 && styles.streakPillInactive]}>
              <Text style={styles.streakFlame}>{currentStreak > 0 ? "🔥" : "💤"}</Text>
              <Text style={[styles.streakText, currentStreak === 0 && styles.streakTextInactive]}>
                {streakLabel}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* ── Level / XP card ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.levelShadow}>
          <LinearGradient
            colors={["#6366F1", "#7C3AED", "#9333EA"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelCard}
          >
            <View style={styles.levelOrb} />
            <View style={styles.levelOrb2} />

            <View style={styles.levelHeader}>
              <View style={styles.levelLeft}>
                <View style={styles.levelEyebrowPill}>
                  <Text style={styles.levelEyebrow}>LEVEL PROGRESS</Text>
                </View>
                <Text style={styles.levelTitle}>
                  Level {currentLevel}
                  <Text style={styles.levelName}>  ·  {LEVEL_NAMES[currentLevel] ?? "Mathlete"}</Text>
                </Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNum}>{currentLevel}</Text>
              </View>
            </View>

            <View style={styles.xpMetaRow}>
              <Text style={styles.xpValue}>
                {xpInLevel}
                <Text style={styles.xpOf}> / {XP_PER_LEVEL} XP</Text>
              </Text>
              <View style={styles.xpNextRow}>
                <Text style={styles.xpNext}>{xpToNext} XP to Level {currentLevel + 1}</Text>
                <Feather name="chevron-right" size={12} color="#C7D2FE" />
              </View>
            </View>
            <View style={styles.xpTrack}>
              <Animated.View style={[styles.xpFill, xpBarStyle]} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.statsRow}>
          <StatCard icon="⚡" iconBg="#FEF3C7" value={totalXP.toLocaleString()} label="Total XP" mono />
          <StatCard
            icon="🔥"
            iconBg="#FFEDD5"
            value={`${currentStreak} ${currentStreak === 1 ? "Day" : "Days"}`}
            label="Current"
          />
          <StatCard icon="✓" iconBg="#D1FAE5" iconColor="#059669" value={lessonsCompleted.toString()} label="Lessons" mono />
        </Animated.View>

        {/* ── Continue learning ──────────────────────────────────────────── */}
        {nextLesson && nextTopic && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionGap}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionCaps}>CONTINUE LEARNING</Text>
              <Text style={styles.sectionLink}>Resume</Text>
            </View>
            <ContinueCard
              lessonTitle={nextLesson.title}
              topicTitle={nextTopic.title}
              xp={nextLesson.xp_reward}
              steps={nextLesson.steps.length}
              onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: nextLesson.id, topicTitle: nextTopic.title } })}
            />
          </Animated.View>
        )}

        {/* ── Daily challenge ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <DailyChallengeCard
            subtitle={challengeDone ? "Done for today — come back tomorrow!" : challenge.title}
            xp={challenge.xpReward}
            done={challengeDone}
            onPress={() => router.push("/daily-challenge")}
          />
        </Animated.View>

        {/* ── Topics grid ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.topicsSection}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>Explore Topics</Text>
              <Text style={styles.sectionSub}>Your maths learning path</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/learn")} style={styles.seeAllBtn}>
              <Text style={styles.sectionLink}>See all</Text>
              <Feather name="chevron-right" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.topicsGrid}>
            {TOPICS.map((topic, i) => {
              const completedCount = topic.lessons.filter((l) => completedLessonIds.has(l.id)).length;
              const total = topic.lessons.length;
              const pct = Math.round((completedCount / total) * 100);
              return (
                <TopicCard
                  key={topic.id}
                  title={topic.title}
                  emoji={getCategoryEmoji(topic.category)}
                  color={topic.color}
                  completed={completedCount}
                  total={total}
                  pct={pct}
                  index={i}
                  onPress={() => router.push("/(tabs)/learn")}
                />
              );
            })}
          </View>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: string;
  iconBg: string;
  iconColor?: string;
  value: string;
  label: string;
  mono?: boolean;
}> = ({ icon, iconBg, iconColor, value, label, mono }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
      <Text style={[styles.statIcon, iconColor ? { color: iconColor, fontWeight: "800" } : null]}>{icon}</Text>
    </View>
    <Text style={[styles.statValue, mono && { fontFamily: MONO }]} numberOfLines={1}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/** Shrinks slightly while pressed. */
function usePressScale(to = 0.975) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => { scale.value = withSpring(to, { stiffness: 400, damping: 20 }); },
    onPressOut: () => { scale.value = withSpring(1, { stiffness: 400, damping: 20 }); },
  };
}

const ContinueCard: React.FC<{
  lessonTitle: string;
  topicTitle: string;
  xp: number;
  steps: number;
  onPress: () => void;
}> = ({ lessonTitle, topicTitle, xp, steps, onPress }) => {
  const press = usePressScale();
  const blink = useSharedValue(1);

  useEffect(() => {
    blink.value = withRepeat(withTiming(0.25, { duration: 900 }), -1, true);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  return (
    <Animated.View style={[styles.continueShadow, press.style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Resume ${lessonTitle} lesson`}
      >
        <LinearGradient
          colors={["#F97316", "#EA580C", "#C2410C"]}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.continueCard}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueSheen}
            pointerEvents="none"
          />
          <View style={styles.continueLeft}>
            <View style={styles.upNextPill}>
              <Animated.View style={[styles.upNextDot, dotStyle]} />
              <Text style={styles.upNextText} numberOfLines={1}>
                UP NEXT • {topicTitle.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.continueTitle} numberOfLines={2}>{lessonTitle}</Text>
            <Text style={styles.continueMeta}>
              ⚡ +{xp} XP{"   "}•{"   "}{steps} steps
            </Text>
          </View>
          <View style={styles.playBtn}>
            <Feather name="play" size={22} color="#EA580C" style={{ marginLeft: 3 }} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const DailyChallengeCard: React.FC<{
  subtitle: string;
  xp: number;
  done: boolean;
  onPress: () => void;
}> = ({ subtitle, xp, done, onPress }) => {
  const press = usePressScale();
  return (
    <Animated.View style={[styles.challengeShadow, press.style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={["#F59E0B", "#D97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.challengeCard}
        >
          <View style={styles.challengeIconWrap}>
            <Text style={styles.challengeEmoji}>{done ? "✅" : "⚡"}</Text>
          </View>
          <View style={styles.challengeContent}>
            <View style={styles.challengeTitleRow}>
              <Text style={styles.challengeTitle}>Daily Challenge</Text>
              <View style={styles.todayChip}>
                <Text style={styles.todayChipText}>{done ? "DONE" : "TODAY"}</Text>
              </View>
            </View>
            <Text style={styles.challengeSub} numberOfLines={1}>{subtitle}</Text>
          </View>
          <View style={styles.bonusPill}>
            <Text style={styles.bonusLine1}>+{xp}</Text>
            <Text style={styles.bonusLine2}>XP</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TopicCard: React.FC<{
  title: string;
  emoji: string;
  color: string;
  completed: number;
  total: number;
  pct: number;
  index: number;
  onPress: () => void;
}> = ({ title, emoji, color, completed, total, pct, index, onPress }) => {
  const press = usePressScale(0.96);
  const barWidth = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` }));

  useEffect(() => {
    barWidth.value = withDelay(400 + index * 80, withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [pct]);

  const mastered = pct === 100;
  const started = completed > 0;
  const barColor = mastered ? "#10B981" : started ? color : "#CBD5E1";
  const pctColor = mastered ? "#059669" : started ? color : FAINT;

  return (
    <Animated.View style={[styles.topicCard, started && !mastered && { borderColor: color + "40" }, press.style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        activeOpacity={1}
        style={styles.topicCardInner}
      >
        <View style={styles.topicTopRow}>
          <View style={[styles.topicIconWrap, { backgroundColor: color + "14", borderColor: color + "26" }]}>
            <Text style={styles.topicEmoji}>{emoji}</Text>
          </View>
          {mastered ? (
            <View style={[styles.statusPill, styles.statusMastered]}>
              <Text style={[styles.statusText, { color: "#047857" }]}>✓ Mastered</Text>
            </View>
          ) : started ? (
            <View style={[styles.statusPill, { backgroundColor: color + "14", borderColor: color + "33" }]}>
              <Text style={[styles.statusText, { color }]}>In Progress</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, styles.statusNew]}>
              <Text style={[styles.statusText, { color: FAINT }]}>New</Text>
            </View>
          )}
        </View>

        <Text style={styles.topicTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.topicSub}>{completed}/{total} done</Text>

        <View style={styles.topicTrack}>
          <Animated.View style={[styles.topicFill, { backgroundColor: barColor }, barStyle]} />
        </View>
        <Text style={[styles.topicPct, { color: pctColor }]}>{pct}%</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

function getCategoryEmoji(category: string) {
  const map: Record<string, string> = {
    arithmetic: "🔢",
    algebra: "🔣",
    geometry: "📐",
    word_problems: "📝",
    fractions: "🍕",
    percentages: "💯",
    number_theory: "🔑",
    statistics: "📊",
    probability: "🎲",
    measurement: "📏",
  };
  return map[category] ?? "📚";
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 20 },

  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#EDE9FE",
  },
  avatarText: { color: "#FFFFFF", fontWeight: "800", fontSize: 17 },
  headerText: { flex: 1 },
  greeting: { fontSize: 11, color: FAINT, fontWeight: "600", letterSpacing: 1 },
  username: { fontSize: 20, fontWeight: "800", color: INK, letterSpacing: -0.4 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  streakPillInactive: { backgroundColor: "#F8FAFC", borderColor: LINE },
  streakFlame: { fontSize: 15 },
  streakText: { fontSize: 12, fontWeight: "800", color: "#78350F", letterSpacing: -0.2 },
  streakTextInactive: { color: FAINT },

  // Level card
  levelShadow: {
    borderRadius: 24,
    backgroundColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  levelCard: { borderRadius: 24, padding: 20, overflow: "hidden" },
  levelOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  levelOrb2: {
    position: "absolute",
    bottom: -32,
    left: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(49,46,129,0.25)",
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  levelLeft: { flex: 1, alignItems: "flex-start" },
  levelEyebrowPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 99,
    marginBottom: 6,
  },
  levelEyebrow: { fontSize: 10, color: "rgba(224,231,255,0.9)", fontWeight: "700", letterSpacing: 1.5 },
  levelTitle: { fontSize: 24, color: "#FFFFFF", fontWeight: "900", letterSpacing: -0.5 },
  levelName: { fontSize: 18, color: "#C7D2FE", fontWeight: "500", letterSpacing: 0 },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  levelNum: { color: "#FFFFFF", fontWeight: "800", fontSize: 18 },
  xpMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  xpValue: { fontFamily: MONO, fontSize: 14, color: "rgba(255,255,255,0.92)", fontWeight: "700" },
  xpOf: { fontFamily: MONO, fontSize: 12, color: "#C7D2FE", fontWeight: "400" },
  xpNextRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  xpNext: { fontSize: 11, color: "#C7D2FE", fontWeight: "500" },
  xpTrack: {
    height: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 99,
    padding: 2,
    overflow: "hidden",
  },
  xpFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 99, minWidth: 4 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: LINE,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statIcon: { fontSize: 14 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#1E293B", letterSpacing: -0.3 },
  statLabel: {
    fontSize: 10,
    color: FAINT,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 1,
  },

  // Sections
  sectionGap: { gap: 8 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sectionCaps: { fontSize: 13, fontWeight: "700", color: INK, letterSpacing: 0.3 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: INK, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: MUTED, fontWeight: "500", marginTop: 1 },
  sectionLink: { fontSize: 12, color: COLORS.primary, fontWeight: "700" },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 4 },

  // Continue card
  continueShadow: {
    borderRadius: 24,
    backgroundColor: "#EA580C",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 9,
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: 20,
    borderRadius: 24,
    overflow: "hidden",
  },
  continueSheen: { position: "absolute", top: 0, bottom: 0, right: 0, width: "50%" },
  continueLeft: { flex: 1, gap: 6, alignItems: "flex-start" },
  upNextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    maxWidth: "100%",
  },
  upNextDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FCD34D" },
  upNextText: { color: "#FDE68A", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, flexShrink: 1 },
  continueTitle: { fontSize: 18, color: "#FFFFFF", fontWeight: "800", letterSpacing: -0.3, lineHeight: 24 },
  continueMeta: { fontSize: 12, color: "#FFEDD5", fontWeight: "500" },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },

  // Challenge card
  challengeShadow: {
    borderRadius: 18,
    backgroundColor: "#D97706",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderRadius: 18,
    overflow: "hidden",
  },
  challengeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  challengeEmoji: { fontSize: 18 },
  challengeContent: { flex: 1 },
  challengeTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  challengeTitle: { color: "#FFFFFF", fontWeight: "700", fontSize: 14, letterSpacing: -0.2 },
  todayChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  todayChipText: { color: "#FEF3C7", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  challengeSub: { color: "#FEF3C7", fontSize: 12, fontWeight: "500", marginTop: 2 },
  bonusPill: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  bonusLine1: { fontFamily: MONO, color: "#FFFFFF", fontWeight: "900", fontSize: 12, lineHeight: 14 },
  bonusLine2: { color: "#FEF3C7", fontWeight: "700", fontSize: 9, letterSpacing: 0.8 },

  // Topics
  topicsSection: { gap: 12 },
  topicsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  topicCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topicCardInner: { padding: 16 },
  topicTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 6,
  },
  topicIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topicEmoji: { fontSize: 18 },
  statusPill: {
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
  },
  statusMastered: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  statusNew: { backgroundColor: "#F8FAFC", borderColor: "#F1F5F9" },
  statusText: { fontSize: 10, fontWeight: "700" },
  topicTitle: { fontSize: 14, fontWeight: "700", color: INK, letterSpacing: -0.2 },
  topicSub: { fontSize: 11, color: MUTED, fontWeight: "500", marginTop: 1 },
  topicTrack: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 12,
  },
  topicFill: { height: "100%", borderRadius: 99 },
  topicPct: { fontFamily: MONO, fontSize: 10, fontWeight: "700", alignSelf: "flex-end", marginTop: 4 },
});
