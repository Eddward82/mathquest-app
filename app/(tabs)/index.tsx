import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
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
  FadeInRight,
} from "react-native-reanimated";
import { useAuthStore } from "../../src/store/authStore";
import { useProgressStore } from "../../src/store/progressStore";
import {
  COLORS,
  BORDER_RADIUS,
  SHADOWS,
  LEVEL_NAMES,
  XP_PER_LEVEL,
} from "../../src/constants/theme";
import { TOPICS } from "../../src/data/lessons";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { user } = useAuthStore();
  const {
    totalXP,
    currentLevel,
    currentStreak,
    lessonsCompleted,
    loadProgress,
    topics,
    isLoading,
  } = useProgressStore();

  const [refreshing, setRefreshing] = React.useState(false);

  // XP bar animation
  const xpPct = ((totalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.username}>{user?.username ?? "Learner"} 👋</Text>
          </View>
          {/* Streak badge */}
          <Animated.View style={flameStyle}>
            <TouchableOpacity style={[
              styles.streakBadge,
              currentStreak === 0 && styles.streakBadgeInactive,
            ]} activeOpacity={0.8}>
              <Text style={styles.streakFlame}>{currentStreak > 0 ? "🔥" : "💤"}</Text>
              <Text style={[styles.streakCount, currentStreak === 0 && styles.streakCountInactive]}>
                {currentStreak}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ── Level / XP card ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <LinearGradient
            colors={["#5B4FE8", "#7C6FF7", "#9B8FF5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelCard}
          >
            {/* Decorative orb */}
            <View style={styles.levelOrb} />
            <View style={styles.levelOrb2} />

            <View style={styles.levelHeader}>
              <View style={styles.levelLeft}>
                <Text style={styles.levelEyebrow}>LEVEL {currentLevel}</Text>
                <Text style={styles.levelName}>{LEVEL_NAMES[currentLevel] ?? "Mathlete"}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNum}>{currentLevel}</Text>
              </View>
            </View>

            <View style={styles.xpTrack}>
              <Animated.View style={[styles.xpFill, xpBarStyle]}>
                {/* Shimmer highlight */}
                <View style={styles.xpShimmer} />
              </Animated.View>
            </View>

            <View style={styles.levelFooter}>
              <Text style={styles.xpLabel}>
                {totalXP % XP_PER_LEVEL} / {XP_PER_LEVEL} XP
              </Text>
              <Text style={styles.xpNext}>→ Level {currentLevel + 1}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.statsRow}>
          <StatCard icon="⚡" label="Total XP" value={totalXP.toLocaleString()} color="#6C63FF" bg="#EEF2FF" border="#C7D2FE" />
          <StatCard icon="🔥" label="Streak" value={`${currentStreak}d`} color="#EA580C" bg="#FFF7ED" border="#FED7AA" />
          <StatCard icon="✅" label="Lessons" value={lessonsCompleted.toString()} color="#16A34A" bg="#F0FDF4" border="#BBF7D0" />
        </Animated.View>

        {/* ── Continue learning ──────────────────────────────────────────── */}
        {nextLesson && nextTopic && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <SectionLabel title="Continue Learning" />
            <ContinueCard
              lesson={nextLesson}
              topic={nextTopic}
              onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: nextLesson.id, topicTitle: nextTopic.title } })}
            />
          </Animated.View>
        )}

        {/* ── Daily challenge ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <SectionLabel title="Daily Challenge" />
          <DailyChallengeCard onPress={() => router.push("/(tabs)/learn")} />
        </Animated.View>

        {/* ── Topics grid ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(320).springify()}>
          <SectionLabel title="Topics" onMore={() => router.push("/(tabs)/learn")} />
          <View style={styles.topicsGrid}>
            {TOPICS.map((topic, i) => {
              const completedCount = topic.lessons.filter((l) =>
                useProgressStore.getState().completedLessonIds.has(l.id)
              ).length;
              const total = topic.lessons.length;
              const pct = Math.round((completedCount / total) * 100);
              return (
                <TopicCard
                  key={topic.id}
                  topic={topic}
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

const SectionLabel: React.FC<{ title: string; onMore?: () => void }> = ({ title, onMore }) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onMore && (
      <TouchableOpacity onPress={onMore} style={styles.seeAllBtn}>
        <Text style={styles.seeAll}>See all</Text>
        <Feather name="chevron-right" size={14} color={COLORS.primary} />
      </TouchableOpacity>
    )}
  </View>
);

const StatCard: React.FC<{
  icon: string; label: string; value: string; color: string; bg: string; border: string;
}> = ({ icon, label, value, color, bg, border }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.statCard, { backgroundColor: bg, borderColor: border }, animStyle]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

const ContinueCard: React.FC<{ lesson: any; topic: any; onPress: () => void }> = ({ lesson, topic, onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { stiffness: 400, damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 400, damping: 20 }); }}
        activeOpacity={1}
        style={styles.continueCard}
      >
        <LinearGradient
          colors={[topic.color, shadeColor(topic.color, -20)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.continueGradient}
        >
          {/* Background decoration */}
          <View style={[styles.continueOrb, { backgroundColor: "rgba(255,255,255,0.08)" }]} />

          <View style={styles.continueLeft}>
            <View style={styles.upNextPill}>
              <Text style={styles.upNextText}>▶ UP NEXT</Text>
            </View>
            <Text style={styles.continueTitle} numberOfLines={2}>{lesson.title}</Text>
            <Text style={styles.continueTopic}>{topic.title}</Text>
          </View>

          <View style={styles.continueRight}>
            <View style={styles.playBtn}>
              <Feather name="play" size={22} color={topic.color} />
            </View>
            <View style={styles.xpPill}>
              <Text style={styles.xpPillText}>+{lesson.xp_reward} XP</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const DailyChallengeCard: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { stiffness: 400, damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 400, damping: 20 }); }}
        activeOpacity={1}
        style={styles.challengeCard}
      >
        <LinearGradient
          colors={["#D97706", "#F59E0B", "#FCD34D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.challengeGradient}
        >
          <View style={styles.challengeOrb} />
          <View style={styles.challengeIconWrap}>
            <Text style={styles.challengeEmoji}>⚡</Text>
          </View>
          <View style={styles.challengeContent}>
            <Text style={styles.challengeTitle}>Daily Challenge</Text>
            <Text style={styles.challengeSub}>Complete a lesson to keep your streak!</Text>
          </View>
          <View style={styles.bonusPill}>
            <Text style={styles.bonusLine1}>+50</Text>
            <Text style={styles.bonusLine2}>XP</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TopicCard: React.FC<{
  topic: any; completed: number; total: number; pct: number; index: number; onPress: () => void;
}> = ({ topic, completed, total, pct, index, onPress }) => {
  const scale = useSharedValue(1);
  const barWidth = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` }));

  useEffect(() => {
    barWidth.value = withDelay(400 + index * 80, withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [pct]);

  return (
    <Animated.View style={[styles.topicCard, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { stiffness: 400, damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 400, damping: 20 }); }}
        activeOpacity={1}
        style={styles.topicCardInner}
      >
        <View style={[styles.topicIconWrap, { backgroundColor: topic.color + "18" }]}>
          <Text style={styles.topicEmoji}>{getCategoryEmoji(topic.category)}</Text>
        </View>
        <Text style={styles.topicTitle} numberOfLines={1}>{topic.title}</Text>
        <Text style={styles.topicSub}>{completed}/{total} done</Text>
        <View style={styles.topicTrack}>
          <Animated.View style={[styles.topicFill, { backgroundColor: topic.color }, barStyle]} />
        </View>
        <Text style={[styles.topicPct, { color: topic.color }]}>{pct}%</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
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

/** Darken a hex color by `amount` percent */
function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, gap: 18 },

  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { fontSize: 13, color: "#6B7280", fontWeight: "500", letterSpacing: 0.2 },
  username: { fontSize: 24, fontWeight: "900", color: "#111827", letterSpacing: -0.5 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  streakBadgeInactive: { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" },
  streakFlame: { fontSize: 18 },
  streakCount: { fontSize: 18, fontWeight: "900", color: "#EA580C" },
  streakCountInactive: { color: "#94A3B8" },

  // Level card
  levelCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    overflow: "hidden",
    shadowColor: "#5B4FE8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  levelOrb: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  levelOrb2: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  levelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  levelLeft: { gap: 2 },
  levelEyebrow: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: 1.2 },
  levelName: { fontSize: 20, color: "#FFFFFF", fontWeight: "800", letterSpacing: -0.3 },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  levelNum: { color: "#FFFFFF", fontWeight: "900", fontSize: 22 },
  xpTrack: { height: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" },
  xpFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 99, minWidth: 4 },
  xpShimmer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 20,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 99,
  },
  levelFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  xpNext: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "500" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  // Section
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },

  // Continue card
  continueCard: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  continueGradient: { flexDirection: "row", alignItems: "center", padding: 20, gap: 14, overflow: "hidden" },
  continueOrb: { position: "absolute", top: -30, right: -20, width: 120, height: 120, borderRadius: 60 },
  continueLeft: { flex: 1, gap: 6 },
  upNextPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  upNextText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  continueTitle: { fontSize: 18, color: "#FFFFFF", fontWeight: "800", letterSpacing: -0.3, lineHeight: 24 },
  continueTopic: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  continueRight: { alignItems: "center", gap: 8 },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  xpPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  xpPillText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },

  // Challenge card
  challengeCard: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  challengeGradient: { flexDirection: "row", alignItems: "center", padding: 18, gap: 14, overflow: "hidden" },
  challengeOrb: {
    position: "absolute",
    top: -20,
    right: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  challengeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  challengeEmoji: { fontSize: 26 },
  challengeContent: { flex: 1 },
  challengeTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 16, letterSpacing: -0.2 },
  challengeSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 17, marginTop: 3, fontWeight: "500" },
  bonusPill: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  bonusLine1: { color: "#FFFFFF", fontWeight: "900", fontSize: 18, lineHeight: 20 },
  bonusLine2: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 11 },

  // Topics
  topicsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  topicCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0EDFF",
  },
  topicCardInner: { padding: 16, gap: 6 },
  topicIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  topicEmoji: { fontSize: 22 },
  topicTitle: { fontSize: 15, fontWeight: "800", color: "#111827", letterSpacing: -0.2 },
  topicSub: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  topicTrack: { height: 5, backgroundColor: "#F1F5F9", borderRadius: 99, overflow: "hidden" },
  topicFill: { height: "100%", borderRadius: 99, minWidth: 2 },
  topicPct: { fontSize: 12, fontWeight: "800" },
});
