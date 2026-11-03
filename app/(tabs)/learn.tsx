import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  FadeInDown,
  SlideInDown,
  SlideOutUp,
} from "react-native-reanimated";
import { useAuthStore } from "../../src/store/authStore";
import { useProgressStore } from "../../src/store/progressStore";
import { useSubscriptionStore } from "../../src/store/subscriptionStore";
import { getTodayChallenge, isChallengeCompleted } from "../../src/data/dailyChallenges";
import { PaywallModal } from "../../src/components/subscription/PaywallModal";
import { Topic, Lesson } from "../../src/types";

const BRAND = "#6C5CE7";
const BRAND_DARK = "#5842DC";
const BRAND_SOFT = "#EDE9FE";
const INK = "#0F172A";
const BODY = "#1E293B";
const MUTED = "#64748B";
const FAINT = "#94A3B8";
const LINE = "#E2E8F0";

const NODE = 36;

export default function LearnScreen() {
  const { user } = useAuthStore();
  const { topics, loadProgress, completedLessonIds, completedReviews, dailyChallengeCompletedDate } = useProgressStore();
  const { canStartLesson, remainingToday, isPremium } = useSubscriptionStore();
  const todayChallenge = getTodayChallenge();
  const challengeDone = isChallengeCompleted(dailyChallengeCompletedDate);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const [showWelcome, setShowWelcome] = useState(welcome === "1");

  useEffect(() => {
    if (user) loadProgress(user.id);
  }, [user]);

  // Auto-dismiss welcome banner after 4 seconds
  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => setShowWelcome(false), 4000);
    return () => clearTimeout(t);
  }, [showWelcome]);

  const filtered = topics.filter((t) => !selectedTopic || t.id === selectedTopic);

  const handleLessonPress = (id: string, topicTitle: string) => {
    if (!canStartLesson(id)) {
      setShowPaywall(true);
      return;
    }
    router.push({ pathname: "/lesson/[id]", params: { id, topicTitle } });
  };

  const remaining = remainingToday();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />

      {/* Welcome banner — shown once after onboarding */}
      {showWelcome && (
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutUp.duration(300)}
          style={styles.welcomeBanner}
        >
          <LinearGradient
            colors={[BRAND, "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.welcomeGradient}
          >
            <Text style={styles.welcomeEmoji}>🎉</Text>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>You&apos;re all set, {user?.username?.split(" ")[0] ?? "there"}!</Text>
              <Text style={styles.welcomeSub}>Your personalised learning path is ready.</Text>
            </View>
            <TouchableOpacity onPress={() => setShowWelcome(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Learning Path</Text>
            <Text style={styles.subtitle}>Master maths topic by topic</Text>
          </View>
          <TouchableOpacity
            onPress={() => { if (!isPremium) router.push("/paywall"); }}
            activeOpacity={isPremium ? 1 : 0.8}
            disabled={isPremium}
          >
            <LinearGradient
              colors={!isPremium && remaining === 0 ? ["#FEF2F2", "#FEE2E2"] : ["#FFFBEB", "#FEF3C7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.premiumPill, !isPremium && remaining === 0 && styles.premiumPillEmpty]}
            >
              <Text style={styles.premiumIcon}>👑</Text>
              <Text style={[styles.premiumText, !isPremium && remaining === 0 && styles.premiumTextEmpty]}>
                {isPremium ? "Premium" : remaining === 0 ? "Limit hit" : `${remaining} left`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Daily challenge card ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(40).springify()} style={[styles.challengeShadow, challengeDone && styles.challengeShadowDone]}>
          <TouchableOpacity onPress={() => router.push("/daily-challenge")} activeOpacity={0.9}>
            <LinearGradient
              colors={challengeDone ? ["#475569", "#334155"] : [BRAND, "#5B4AD8", "#4C3CC4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.challengeCard}
            >
              <View style={styles.challengeOrb} />
              <View style={styles.challengeOrb2} />
              <View style={styles.challengeIconTile}>
                <Text style={styles.challengeEmoji}>{challengeDone ? "✅" : todayChallenge.topicEmoji}</Text>
              </View>
              <View style={styles.challengeText}>
                <View style={styles.challengeTagRow}>
                  <View style={styles.challengeTag}>
                    <Text style={styles.challengeTagText}>DAILY CHALLENGE</Text>
                  </View>
                  {!challengeDone && (
                    <Text style={styles.challengeTime}>• {hoursUntilReset()}h left</Text>
                  )}
                </View>
                <Text style={styles.challengeTitle} numberOfLines={1}>
                  {challengeDone ? "Done — come back tomorrow!" : todayChallenge.title}
                </Text>
              </View>
              <View style={styles.challengeRight}>
                {!challengeDone && (
                  <View style={styles.challengeXP}>
                    <Text style={styles.challengeXPText}>+{todayChallenge.xpReward} XP</Text>
                  </View>
                )}
                <View style={styles.challengeChevron}>
                  <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.85)" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Filter chips ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.filterOuter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <FilterChip label="All" active={selectedTopic === null} onPress={() => setSelectedTopic(null)} />
            {topics.map((t) => (
              <FilterChip
                key={t.id}
                label={t.title}
                icon={getCategoryEmoji(t.category)}
                active={selectedTopic === t.id}
                onPress={() => setSelectedTopic(selectedTopic === t.id ? null : t.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Topic sections ───────────────────────────────────────────────── */}
        {filtered.map((topic, i) => (
          <Animated.View key={topic.id} entering={FadeInDown.delay(120 + i * 60).springify()}>
            <TopicSection
              topic={topic}
              completedIds={completedLessonIds}
              completedReviews={completedReviews}
              onLessonPress={(id) => handleLessonPress(id, topic.title)}
              onReviewPress={(topicId) => router.push({ pathname: "/review/[topicId]", params: { topicId } })}
              onPracticePress={(topicId) => router.push({ pathname: "/practice/[topicId]", params: { topicId } })}
            />
          </Animated.View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── TopicSection ──────────────────────────────────────────────────────────────

interface TopicSectionProps {
  topic: Topic;
  completedIds: Set<string>;
  completedReviews: Set<string>;
  onLessonPress: (id: string) => void;
  onReviewPress: (topicId: string) => void;
  onPracticePress: (topicId: string) => void;
}

const TopicSection: React.FC<TopicSectionProps> = ({ topic, completedIds, completedReviews, onLessonPress, onReviewPress, onPracticePress }) => {
  const completedCount = topic.lessons.filter((l) => completedIds.has(l.id)).length;
  const total = topic.lessons.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const allLessonsComplete = completedCount === total;

  // The first unlocked, unfinished lesson is "current" and gets the pulse.
  const currentIdx = topic.lessons.findIndex((l, idx) =>
    !completedIds.has(l.id) && (idx === 0 || completedIds.has(topic.lessons[idx - 1].id))
  );

  return (
    <View style={styles.topicBlock}>
      {/* Module card */}
      <LinearGradient
        colors={[BRAND, "#4F46E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.moduleCard}
      >
        <View style={styles.moduleLeft}>
          <View style={styles.moduleTile}>
            <Text style={styles.moduleEmoji}>{getCategoryEmoji(topic.category)}</Text>
          </View>
          <View style={styles.moduleText}>
            <Text style={styles.moduleTitle} numberOfLines={1}>{topic.title}</Text>
            <Text style={styles.moduleSub}>{completedCount} of {total} lessons complete</Text>
          </View>
        </View>
        <View style={styles.moduleRight}>
          {completedCount > 0 && (
            <TouchableOpacity
              onPress={() => onPracticePress(topic.id)}
              style={styles.practiceBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="refresh-cw" size={12} color="#FFFFFF" />
              <Text style={styles.practiceBtnText}>Practice</Text>
            </TouchableOpacity>
          )}
          <View style={styles.pctBadge}>
            <Text style={styles.pctText}>{pct}%</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Milestone pathway */}
      <View style={styles.pathway}>
        <LinearGradient
          colors={["#8B5CF6", "#A78BFA", "#FCD34D"]}
          style={styles.spine}
          pointerEvents="none"
        />
        {topic.lessons.map((lesson, idx) => {
          const isCompleted = completedIds.has(lesson.id);
          const isLocked = idx > 0 && !completedIds.has(topic.lessons[idx - 1].id);
          return (
            <LessonNode
              key={lesson.id}
              lesson={lesson}
              index={idx}
              isCompleted={isCompleted}
              isLocked={isLocked}
              isCurrent={idx === currentIdx}
              onPress={() => { if (!isLocked) onLessonPress(lesson.id); }}
            />
          );
        })}

        <ReviewNode
          allLessonsComplete={allLessonsComplete}
          isReviewComplete={completedReviews.has(topic.id)}
          onPress={() => onReviewPress(topic.id)}
        />
      </View>
    </View>
  );
};

// ── PulseRing ─────────────────────────────────────────────────────────────────

const PulseRing: React.FC<{ color: string }> = ({ color }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.bezier(0.24, 0, 0.38, 1) }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - t.value),
    transform: [{ scale: 1 + t.value * 0.55 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.pulseRing, { backgroundColor: color }, style]} />;
};

// ── LessonNode ────────────────────────────────────────────────────────────────

interface LessonNodeProps {
  lesson: Lesson;
  index: number;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
  onPress: () => void;
}

const LessonNode: React.FC<LessonNodeProps> = ({ lesson, index, isCompleted, isLocked, isCurrent, onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.nodeRow, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { if (!isLocked) scale.value = withSpring(0.97, { stiffness: 500, damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 500, damping: 20 }); }}
        disabled={isLocked}
        activeOpacity={1}
        style={styles.nodeTouch}
        accessibilityRole="button"
        accessibilityLabel={`${lesson.title}${isLocked ? ", locked" : isCompleted ? ", completed" : ""}`}
      >
        {/* Node */}
        <View style={styles.nodeWrap}>
          {isCurrent && <PulseRing color={BRAND} />}
          <View
            style={[
              styles.node,
              isCompleted && styles.nodeDone,
              isCurrent && styles.nodeCurrent,
              isLocked && styles.nodeLocked,
            ]}
          >
            {isCompleted ? (
              <Feather name="check" size={16} color="#FFFFFF" />
            ) : isLocked ? (
              <Feather name="lock" size={13} color={FAINT} />
            ) : (
              <Text style={styles.nodeNum}>{index + 1}</Text>
            )}
          </View>
        </View>

        {/* Card */}
        <LinearGradient
          colors={isLocked ? ["#F8FAFC", "#F8FAFC"] : ["#FFFFFF", "#FAFBFF"]}
          style={[styles.lessonCard, isCurrent && styles.lessonCardCurrent]}
        >
          <View style={styles.lessonText}>
            <Text style={[styles.lessonName, isLocked && styles.lockedText]} numberOfLines={1}>{lesson.title}</Text>
            <Text style={[styles.lessonDesc, isLocked && styles.lockedText]} numberOfLines={1}>{lesson.description}</Text>
          </View>
          <View style={[styles.xpPill, isLocked && styles.xpPillLocked]}>
            <Text style={styles.xpPillIcon}>⚡</Text>
            <Text style={[styles.xpPillText, isLocked && { color: FAINT }]}>{lesson.xp_reward}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── ReviewNode (topic "boss") ─────────────────────────────────────────────────

interface ReviewNodeProps {
  allLessonsComplete: boolean;
  isReviewComplete: boolean;
  onPress: () => void;
}

const ReviewNode: React.FC<ReviewNodeProps> = ({ allLessonsComplete, isReviewComplete, onPress }) => {
  const isLocked = !allLessonsComplete;
  const isReady = !isLocked && !isReviewComplete;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.nodeRow, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { if (!isLocked) scale.value = withSpring(0.97, { stiffness: 500, damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 500, damping: 20 }); }}
        disabled={isLocked}
        activeOpacity={1}
        style={styles.nodeTouch}
        accessibilityRole="button"
        accessibilityLabel={`Topic review${isLocked ? ", locked" : isReviewComplete ? ", completed" : ""}`}
      >
        <View style={styles.nodeWrap}>
          {isReady && <PulseRing color="#F59E0B" />}
          {isLocked ? (
            <View style={[styles.node, styles.nodeLocked]}>
              <Feather name="lock" size={13} color={FAINT} />
            </View>
          ) : (
            <LinearGradient
              colors={["#F59E0B", "#FACC15"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={[styles.node, styles.nodeBoss]}
            >
              {isReviewComplete
                ? <Feather name="award" size={16} color="#FFFFFF" />
                : <Text style={styles.bossEmoji}>🏆</Text>}
            </LinearGradient>
          )}
        </View>

        <LinearGradient
          colors={isLocked ? ["#F8FAFC", "#F8FAFC"] : ["#FFFBEB", "#FFFFFF", "#FAF5FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.lessonCard, isLocked ? styles.bossCardLocked : styles.bossCard]}
        >
          <View style={styles.lessonText}>
            <View style={[styles.bossTag, isLocked && styles.bossTagLocked]}>
              <Text style={[styles.bossTagText, isLocked && { color: FAINT }]}>TOPIC REVIEW</Text>
            </View>
            <Text style={[styles.bossTitle, isLocked && styles.lockedText]}>
              {isReviewComplete ? "Review complete" : "Mixed Challenge"}
            </Text>
            <Text style={[styles.lessonDesc, isLocked && styles.lockedText]} numberOfLines={1}>
              {isLocked
                ? "Finish every lesson to unlock"
                : isReviewComplete
                ? "Well done — you aced this topic"
                : "10 questions · score 7+ for a badge"}
            </Text>
          </View>
          {isReady ? (
            <View style={styles.playBtn}>
              <Text style={styles.playBtnText}>Play</Text>
              <Feather name="play" size={12} color="#FFFFFF" />
            </View>
          ) : (
            <View style={[styles.xpPill, isLocked && styles.xpPillLocked]}>
              <Text style={styles.xpPillIcon}>⚡</Text>
              <Text style={[styles.xpPillText, isLocked && { color: FAINT }]}>150</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── FilterChip ────────────────────────────────────────────────────────────────

const FilterChip: React.FC<{
  label: string; icon?: string; active: boolean; onPress: () => void;
}> = ({ label, icon, active, onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.94, { stiffness: 500 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 500 }); }}
        activeOpacity={1}
        style={[styles.filterChip, active && styles.filterChipActive]}
      >
        {icon
          ? <Text style={styles.filterIcon}>{icon}</Text>
          : <Feather name="globe" size={13} color={active ? "#FFFFFF" : MUTED} />}
        <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Daily challenges roll over at UTC midnight (see getTodayChallenge). */
function hoursUntilReset() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now.getTime()) / 3_600_000));
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
    ratio: "⚖️",
  };
  return map[category] ?? "📚";
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FCFCFF" },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 16 },

  // Welcome banner
  welcomeBanner: { marginHorizontal: 12, marginTop: 8, borderRadius: 16, overflow: "hidden" },
  welcomeGradient: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  welcomeEmoji: { fontSize: 22 },
  welcomeText: { flex: 1, gap: 1 },
  welcomeTitle: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  welcomeSub: { fontSize: 12, color: "rgba(255,255,255,0.78)", fontWeight: "500" },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    gap: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: "800", color: INK, letterSpacing: -0.6 },
  subtitle: { fontSize: 12, color: FAINT, fontWeight: "500", marginTop: 2 },
  premiumPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  premiumPillEmpty: { borderColor: "#FECACA" },
  premiumIcon: { fontSize: 12 },
  premiumText: { fontSize: 12, fontWeight: "800", color: "#B45309", letterSpacing: 0.3 },
  premiumTextEmpty: { color: "#DC2626" },

  // Daily challenge
  challengeShadow: {
    borderRadius: 18,
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  challengeShadowDone: { backgroundColor: "#475569", shadowColor: "#000", shadowOpacity: 0.12 },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    overflow: "hidden",
  },
  challengeOrb: {
    position: "absolute", top: -40, right: -40,
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  challengeOrb2: {
    position: "absolute", bottom: -40, left: -24,
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(167,139,250,0.18)",
  },
  challengeIconTile: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  challengeEmoji: { fontSize: 24 },
  challengeText: { flex: 1 },
  challengeTagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  challengeTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  challengeTagText: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.92)", letterSpacing: 0.8 },
  challengeTime: { fontSize: 10, fontWeight: "500", color: "#E9D5FF" },
  challengeTitle: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.2, marginTop: 3 },
  challengeRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  challengeXP: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
  },
  challengeXPText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  challengeChevron: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },

  // Filter chips
  filterOuter: { marginHorizontal: -16 },
  filterRow: { gap: 8, paddingVertical: 4, paddingHorizontal: 16 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterIcon: { fontSize: 12 },
  filterLabel: { fontSize: 12, fontWeight: "600", color: "#475569" },
  filterLabelActive: { color: "#FFFFFF", fontWeight: "700" },

  // Topic block
  topicBlock: { gap: 12 },
  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    gap: 10,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  moduleLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  moduleTile: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  moduleEmoji: { fontSize: 20 },
  moduleText: { flex: 1 },
  moduleTitle: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.2 },
  moduleSub: { fontSize: 12, color: BRAND_SOFT, fontWeight: "500", marginTop: 2 },
  moduleRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  practiceBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  practiceBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  pctBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pctText: { color: BRAND_DARK, fontWeight: "800", fontSize: 12 },

  // Pathway
  pathway: { gap: 14, paddingBottom: 8, paddingLeft: 2 },
  spine: {
    position: "absolute",
    left: 2 + NODE / 2 - 1,
    top: NODE / 2 + 12,
    bottom: NODE / 2 + 20,
    width: 2,
    borderRadius: 1,
  },
  nodeRow: {},
  nodeTouch: { flexDirection: "row", alignItems: "center", gap: 12 },
  nodeWrap: { width: NODE, height: NODE, alignItems: "center", justifyContent: "center" },
  pulseRing: {
    position: "absolute",
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: BRAND,
  },
  nodeDone: {
    backgroundColor: BRAND,
    borderColor: "#FFFFFF",
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeCurrent: {
    borderWidth: 2.5,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  nodeLocked: { backgroundColor: "#F1F5F9", borderColor: "#FFFFFF", borderWidth: 2 },
  nodeBoss: {
    borderColor: "#FFFFFF",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  nodeNum: { fontWeight: "800", fontSize: 14, color: BRAND },
  bossEmoji: { fontSize: 14 },

  lessonCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
  },
  lessonCardCurrent: { borderColor: "#C4B5FD" },
  lessonText: { flex: 1 },
  lessonName: { fontSize: 14, fontWeight: "700", color: BODY, letterSpacing: -0.2 },
  lessonDesc: { fontSize: 12, color: MUTED, marginTop: 2 },
  lockedText: { color: FAINT },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  xpPillLocked: { backgroundColor: "#F1F5F9", borderColor: "#F1F5F9" },
  xpPillIcon: { fontSize: 11 },
  xpPillText: { fontSize: 12, fontWeight: "700", color: "#B45309" },

  // Boss card
  bossCard: {
    borderWidth: 2,
    borderColor: "#FCD34D",
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  bossCardLocked: { borderStyle: "dashed", borderColor: "#CBD5E1", borderWidth: 1.5 },
  bossTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(253,230,138,0.6)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  bossTagLocked: { backgroundColor: "#F1F5F9" },
  bossTagText: { fontSize: 9, fontWeight: "900", color: "#B45309", letterSpacing: 0.8 },
  bossTitle: { fontSize: 14, fontWeight: "700", color: INK, letterSpacing: -0.2, marginTop: 3 },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
});
