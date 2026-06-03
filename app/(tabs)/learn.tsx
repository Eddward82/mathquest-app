import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
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
import { COLORS, BORDER_RADIUS } from "../../src/constants/theme";
import { Topic, Lesson } from "../../src/types";

const { width } = Dimensions.get("window");

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
    if (!canStartLesson()) {
      setShowPaywall(true);
      return;
    }
    router.push({ pathname: "/lesson/[id]", params: { id, topicTitle } });
  };

  const remaining = remainingToday();

  return (
    <SafeAreaView style={styles.safe}>
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />

      {/* Welcome banner — shown once after onboarding */}
      {showWelcome && (
        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutUp.duration(300)}
          style={styles.welcomeBanner}
        >
          <LinearGradient
            colors={["#4C35DE", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.welcomeGradient}
          >
            <Text style={styles.welcomeEmoji}>🎉</Text>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>You're all set, {user?.username?.split(" ")[0] ?? "there"}!</Text>
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
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Learning Path</Text>
              <Text style={styles.subtitle}>Master maths topic by topic</Text>
            </View>
            {!isPremium && (
              <TouchableOpacity
                onPress={() => router.push("/paywall")}
                style={styles.limitBadge}
              >
                <Feather name="zap" size={12} color={remaining === 0 ? "#DC2626" : "#92400E"} />
                <Text style={[styles.limitText, remaining === 0 && styles.limitTextEmpty]}>
                  {remaining === 0 ? "Limit hit" : `${remaining} left`}
                </Text>
              </TouchableOpacity>
            )}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>👑 Premium</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Daily challenge card ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <TouchableOpacity
            onPress={() => router.push("/daily-challenge")}
            activeOpacity={0.88}
            style={styles.challengeCard}
          >
            <LinearGradient
              colors={challengeDone ? ["#1A1927", "#252848"] : ["#4C35DE", "#6C63FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.challengeGradient}
            >
              <View style={styles.challengeOrb} />
              <View style={styles.challengeLeft}>
                <Text style={styles.challengeEmoji}>{challengeDone ? "✅" : todayChallenge.topicEmoji}</Text>
                <View style={styles.challengeText}>
                  <Text style={styles.challengeLabel}>DAILY CHALLENGE</Text>
                  <Text style={styles.challengeTitle}>
                    {challengeDone ? "Completed — come back tomorrow!" : todayChallenge.title}
                  </Text>
                </View>
              </View>
              <View style={styles.challengeRight}>
                {!challengeDone && (
                  <View style={styles.challengeXP}>
                    <Text style={styles.challengeXPText}>+{todayChallenge.xpReward} XP</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Filter chips ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <FilterChip label="All" icon="🌐" active={selectedTopic === null} color={COLORS.primary} onPress={() => setSelectedTopic(null)} />
            {topics.map((t) => (
              <FilterChip
                key={t.id}
                label={t.title}
                icon={getCategoryEmoji(t.category)}
                active={selectedTopic === t.id}
                color={t.color}
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

        <View style={{ height: 30 }} />
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
  const pct = total > 0 ? (completedCount / total) * 100 : 0;

  const barWidth = useSharedValue(0);
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` }));
  useEffect(() => {
    barWidth.value = withDelay(200, withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [pct]);

  return (
    <View style={styles.topicCard}>
      {/* Topic header */}
      <LinearGradient
        colors={[topic.color, shadeColor(topic.color, -18)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topicHeader}
      >
        {/* Decorative orb */}
        <View style={[styles.topicOrb, { backgroundColor: "rgba(255,255,255,0.08)" }]} />

        <View style={styles.topicHeaderLeft}>
          <View style={styles.topicIconCircle}>
            <Text style={styles.topicEmoji}>{getCategoryEmoji(topic.category)}</Text>
          </View>
          <View>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicSubtitle}>{completedCount} of {total} complete</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {completedCount > 0 && (
            <TouchableOpacity
              onPress={() => onPracticePress(topic.id)}
              style={styles.practiceBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="repeat" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.practiceBtnText}>Practice</Text>
            </TouchableOpacity>
          )}
          <View style={styles.pctBadge}>
            <Text style={styles.pctText}>{Math.round(pct)}%</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { backgroundColor: topic.color }, barStyle]} />
      </View>

      {/* Lessons path */}
      <View style={styles.lessonsContainer}>
        {topic.lessons.map((lesson, idx) => {
          const isCompleted = completedIds.has(lesson.id);
          const isLocked = idx > 0 && !completedIds.has(topic.lessons[idx - 1].id);
          return (
            <LessonNode
              key={lesson.id}
              lesson={{ ...lesson, is_locked: isLocked }}
              index={idx}
              total={topic.lessons.length}
              isCompleted={isCompleted}
              topicColor={topic.color}
              onPress={() => { if (!isLocked) onLessonPress(lesson.id); }}
            />
          );
        })}

        {/* Topic Review node */}
        <ReviewNode
          topicId={topic.id}
          topicColor={topic.color}
          allLessonsComplete={topic.lessons.every((l) => completedIds.has(l.id))}
          isReviewComplete={completedReviews.has(topic.id)}
          onPress={() => onReviewPress(topic.id)}
        />
      </View>
    </View>
  );
};

// ── LessonNode ────────────────────────────────────────────────────────────────

interface LessonNodeProps {
  lesson: Lesson;
  index: number;
  total: number;
  isCompleted: boolean;
  topicColor: string;
  onPress: () => void;
}

const LessonNode: React.FC<LessonNodeProps> = ({ lesson, index, total, isCompleted, topicColor, onPress }) => {
  const isLocked = lesson.is_locked;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isLast = index === total - 1;

  return (
    <View style={styles.nodeRow}>
      {/* Left: connector + node */}
      <View style={styles.nodeLeft}>
        {/* Top connector line */}
        {index > 0 && (
          <View style={[styles.connectorLine, {
            backgroundColor: isCompleted ? topicColor : "#252848",
          }]} />
        )}

        {/* The node circle */}
        <Animated.View style={animStyle}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={() => { if (!isLocked) scale.value = withSpring(0.9, { stiffness: 500 }); }}
            onPressOut={() => { scale.value = withSpring(1, { stiffness: 500 }); }}
            activeOpacity={isLocked ? 1 : 0.9}
            disabled={isLocked}
            style={[
              styles.nodeCircle,
              {
                backgroundColor: isCompleted ? topicColor : isLocked ? "#1A1D32" : "#1E2038",
                borderColor: isCompleted ? topicColor : isLocked ? "#252848" : topicColor,
                shadowColor: isCompleted || !isLocked ? topicColor : "transparent",
                shadowOpacity: isCompleted ? 0.5 : isLocked ? 0 : 0.3,
              },
            ]}
          >
            {isCompleted ? (
              <Feather name="check" size={18} color="#FFFFFF" />
            ) : isLocked ? (
              <Feather name="lock" size={15} color="#94A3B8" />
            ) : (
              <Text style={[styles.nodeNum, { color: topicColor }]}>{index + 1}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom connector line */}
        {!isLast && (
          <View style={[styles.connectorLine, {
            backgroundColor: completedIds_placeholder(lesson) ? topicColor : "#252848",
          }]} />
        )}
      </View>

      {/* Right: lesson info card */}
      <TouchableOpacity
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={isLocked ? 1 : 0.85}
        style={[styles.lessonCard, isLocked && styles.lessonCardLocked,
          !isLocked && !isCompleted && { borderColor: topicColor + "40" }
        ]}
      >
        <View style={styles.lessonCardContent}>
          <View style={styles.lessonCardLeft}>
            <Text style={[styles.lessonName, isLocked && styles.lockedText]}>{lesson.title}</Text>
            <Text style={[styles.lessonDesc, isLocked && styles.lockedText]} numberOfLines={1}>{lesson.description}</Text>
          </View>
          <View style={[styles.xpChip, {
            backgroundColor: isCompleted ? topicColor + "22" : isLocked ? "#1A1D32" : topicColor + "18",
          }]}>
            <Text style={{ fontSize: 12 }}>⚡</Text>
            <Text style={[styles.xpChipText, { color: isCompleted || !isLocked ? topicColor : "#94A3B8" }]}>
              {lesson.xp_reward}
            </Text>
          </View>
        </View>
        {isCompleted && (
          <View style={[styles.completedStripe, { backgroundColor: topicColor }]} />
        )}
      </TouchableOpacity>
    </View>
  );
};

// Placeholder function — real completion uses completedIds from store
function completedIds_placeholder(_lesson: Lesson) { return false; }

// ── ReviewNode ────────────────────────────────────────────────────────────────

interface ReviewNodeProps {
  topicId: string;
  topicColor: string;
  allLessonsComplete: boolean;
  isReviewComplete: boolean;
  onPress: () => void;
}

const ReviewNode: React.FC<ReviewNodeProps> = ({
  topicColor, allLessonsComplete, isReviewComplete, onPress,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isLocked = !allLessonsComplete;

  return (
    <View style={styles.nodeRow}>
      <View style={styles.nodeLeft}>
        {/* Top connector from last lesson */}
        <View style={[styles.connectorLine, { backgroundColor: allLessonsComplete ? topicColor : "#252848" }]} />

        <Animated.View style={animStyle}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={() => { if (!isLocked) scale.value = withSpring(0.9, { stiffness: 500 }); }}
            onPressOut={() => { scale.value = withSpring(1, { stiffness: 500 }); }}
            disabled={isLocked}
            activeOpacity={isLocked ? 1 : 0.9}
            style={[
              styles.nodeCircle,
              styles.reviewNodeCircle,
              {
                backgroundColor: isReviewComplete ? "#D97706" : isLocked ? "#1A1D32" : "#201608",
                borderColor: isReviewComplete ? "#FFCA3A" : isLocked ? "#252848" : "#FFCA3A",
                shadowColor: isLocked ? "transparent" : "#F59E0B",
                shadowOpacity: isLocked ? 0 : 0.35,
              },
            ]}
          >
            {isReviewComplete ? (
              <Feather name="award" size={20} color="#FFFFFF" />
            ) : isLocked ? (
              <Feather name="lock" size={15} color="#94A3B8" />
            ) : (
              <Text style={styles.reviewNodeEmoji}>🏆</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Review card */}
      <TouchableOpacity
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={isLocked ? 1 : 0.85}
        style={[
          styles.lessonCard,
          styles.reviewCard,
          isLocked && styles.lessonCardLocked,
          !isLocked && !isReviewComplete && { borderColor: "rgba(255,202,58,0.4)", borderWidth: 2 },
          isReviewComplete && { borderColor: "#FFCA3A", borderWidth: 2 },
        ]}
      >
        <View style={styles.lessonCardContent}>
          <View style={styles.lessonCardLeft}>
            <Text style={[styles.reviewCardTitle, isLocked && styles.lockedText]}>
              {isReviewComplete ? "✅ Topic Review Complete" : "🏆 Topic Review"}
            </Text>
            <Text style={[styles.reviewCardDesc, isLocked && styles.lockedText]}>
              {isLocked
                ? "Complete all lessons to unlock"
                : isReviewComplete
                ? "Well done! You aced this topic"
                : "10 questions · 150 XP bonus"}
            </Text>
          </View>
          {!isLocked && (
            <View style={[styles.xpChip, { backgroundColor: isReviewComplete ? "rgba(255,202,58,0.18)" : "rgba(255,202,58,0.1)" }]}>
              <Text style={{ fontSize: 12 }}>⚡</Text>
              <Text style={[styles.xpChipText, { color: "#D97706" }]}>150</Text>
            </View>
          )}
        </View>
        {isReviewComplete && <View style={[styles.completedStripe, { backgroundColor: "#F59E0B" }]} />}
        {!isLocked && !isReviewComplete && (
          <View style={styles.reviewBonusBanner}>
            <Text style={styles.reviewBonusText}>BONUS CHALLENGE · Score 7/10 to earn your topic badge</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ── FilterChip ────────────────────────────────────────────────────────────────

const FilterChip: React.FC<{
  label: string; icon: string; active: boolean; color: string; onPress: () => void;
}> = ({ label, icon, active, color, onPress }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.94, { stiffness: 500 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 500 }); }}
        activeOpacity={1}
        style={[styles.filterChip, active && { backgroundColor: color, borderColor: color }]}
      >
        <Text style={styles.filterIcon}>{icon}</Text>
        <Text style={[styles.filterLabel, { color: active ? "#FFFFFF" : "#6B7494" }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0C1E" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 16 },

  // Daily challenge card
  challengeCard: { borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10 },
  challengeGradient: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12, overflow: "hidden" },
  challengeOrb: { position: "absolute", top: -20, right: 60, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.06)" },
  challengeLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  challengeEmoji: { fontSize: 32 },
  challengeText: { flex: 1, gap: 2 },
  challengeLabel: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.55)", letterSpacing: 1 },
  challengeTitle: { fontSize: 14, fontWeight: "800", color: "#FFFFFF", lineHeight: 19 },
  challengeRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  challengeXP: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  challengeXPText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },

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

  header: { gap: 3 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "900", color: "#E8EDF5", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, color: "#6B7494", fontWeight: "500" },
  limitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,202,58,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255,202,58,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  limitText: { fontSize: 12, fontWeight: "800", color: "#FFCA3A" },
  limitTextEmpty: { color: "#FF595E" },
  premiumBadge: {
    backgroundColor: "rgba(129,140,248,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "rgba(129,140,248,0.3)",
  },
  premiumBadgeText: { fontSize: 12, fontWeight: "800", color: "#818CF8" },

  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: "#252848",
    backgroundColor: "#171A30",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  filterIcon: { fontSize: 14 },
  filterLabel: { fontSize: 13, fontWeight: "700" },

  // Topic card container
  topicCard: {
    backgroundColor: "#171A30",
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#252848",
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    overflow: "hidden",
  },
  topicOrb: { position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: 50 },
  topicHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  topicIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  topicEmoji: { fontSize: 22 },
  topicTitle: { fontSize: 17, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.3 },
  topicSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1, fontWeight: "500" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  practiceBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  practiceBtnText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "700" },
  pctBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pctText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },

  progressTrack: { height: 3, backgroundColor: "#252848", overflow: "hidden" },
  progressFill: { height: "100%", minWidth: 3 },

  lessonsContainer: { padding: 16, gap: 0, backgroundColor: "#171A30" },

  // Lesson node row
  nodeRow: { flexDirection: "row", alignItems: "stretch", gap: 12, minHeight: 72 },
  nodeLeft: { alignItems: "center", width: 44 },
  connectorLine: { width: 2, flex: 1, minHeight: 8 },
  nodeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: "#1E2038",
  },
  nodeNum: { fontWeight: "900", fontSize: 16 },

  // Lesson card
  lessonCard: {
    flex: 1,
    backgroundColor: "#1E2038",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#252848",
    overflow: "hidden",
    alignSelf: "center",
    marginVertical: 6,
  },
  lessonCardLocked: { opacity: 0.45 },
  lessonCardContent: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  lessonCardLeft: { flex: 1, gap: 3 },
  lessonName: { fontSize: 14, fontWeight: "700", color: "#E8EDF5", letterSpacing: -0.1 },
  lessonDesc: { fontSize: 12, color: "#6B7494", fontWeight: "500" },
  lockedText: { color: "#363B6B" },
  xpChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
  },
  xpChipText: { fontSize: 12, fontWeight: "800" },
  completedStripe: { height: 3 },

  reviewNodeCircle: {
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  reviewNodeEmoji: { fontSize: 20 },
  reviewCard: { backgroundColor: "#1A1608" },
  reviewCardTitle: { fontSize: 14, fontWeight: "800", color: "#E8EDF5" },
  reviewCardDesc: { fontSize: 12, color: "#6B7494", fontWeight: "500", marginTop: 2 },
  reviewBonusBanner: {
    backgroundColor: "rgba(255,202,58,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,202,58,0.18)",
  },
  reviewBonusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,202,58,0.7)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
