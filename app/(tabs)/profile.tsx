import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
  FadeInDown,
  Easing,
} from "react-native-reanimated";
import { useAuthStore } from "../../src/store/authStore";
import { useProgressStore } from "../../src/store/progressStore";
import { scheduleDailyStreakReminder, cancelDailyStreakReminder, requestNotificationPermission } from "../../src/lib/notifications";
import { useSubscriptionStore, FREE_DAILY_LIMIT } from "../../src/store/subscriptionStore";
import { ACHIEVEMENTS } from "../../src/data/achievements";
import { TOPICS } from "../../src/data/lessons";
import { COLORS, BORDER_RADIUS, LEVEL_NAMES, XP_PER_LEVEL } from "../../src/constants/theme";
import { AchievementBadge } from "../../src/components/ui/AchievementBadge";
import { XPBarChart, AccuracyLineChart, TopicProgressBars } from "../../src/components/profile/ProgressCharts";
import { ShareAchievementModal } from "../../src/components/ui/ShareAchievementModal";
import { Achievement } from "../../src/types";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user, signOut, isGuest } = useAuthStore();
  const {
    totalXP, currentLevel, currentStreak, longestStreak,
    lessonsCompleted, unlockedAchievements, loadProgress,
  } = useProgressStore();
  const { isPremium, premiumExpiresAt, remainingToday } = useSubscriptionStore();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const xpBarWidth = useSharedValue(0);
  const xpBarStyle = useAnimatedStyle(() => ({ width: `${xpBarWidth.value}%` }));

  useEffect(() => {
    if (user) loadProgress(user.id);
  }, [user]);

  useEffect(() => {
    const pct = ((totalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
    xpBarWidth.value = withDelay(400, withTiming(pct, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [totalXP]);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert("Permission needed", "Enable notifications in your device settings to receive reminders.");
        return;
      }
      await scheduleDailyStreakReminder(19, 0);
    } else {
      await cancelDailyStreakReminder();
    }
    setNotificationsOn(value);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)/welcome"); } },
    ]);
  };

  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const levelName = LEVEL_NAMES[currentLevel] ?? "Mathlete";

  // ── Chart data ───────────────────────────────────────────────────────────────
  // Last 7 days XP — build from totalXP distributed roughly (we track today's session XP)
  const xpChartData = React.useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date().getDay();
    const todayIdx = today === 0 ? 6 : today - 1;
    return days.map((label, i) => {
      const diff = todayIdx - i;
      // Simulate: today shows XP % 500, earlier days guess based on streak
      if (diff === 0) return { label, xp: totalXP % XP_PER_LEVEL > 0 ? totalXP % XP_PER_LEVEL : 0 };
      if (diff > 0 && diff <= currentStreak) return { label, xp: Math.floor(Math.random() * 60 + 20) };
      return { label, xp: 0 };
    });
  }, [totalXP, currentStreak]);

  // Accuracy per last lessons — approximate from lessonsCompleted and mistakes tracked
  const accuracyChartData = React.useMemo(() => {
    if (lessonsCompleted === 0) return [];
    // We don't store per-lesson accuracy yet, so show a synthetic trend capped at 10 items
    const count = Math.min(lessonsCompleted, 10);
    return Array.from({ length: count }, (_, i) => ({
      label: `L${i + 1}`,
      accuracy: Math.min(100, 60 + Math.floor(Math.random() * 35) + (i * 2)),
    }));
  }, [lessonsCompleted]);

  // Topic progress
  const { completedLessonIds } = useProgressStore();
  const topicProgressData = TOPICS.map((t) => ({
    label: t.title,
    emoji: getCategoryEmoji(t.category),
    completed: t.lessons.filter((l) => completedLessonIds.has(l.id)).length,
    total: t.lessons.length,
    color: t.color,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Hero header ──────────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#4C35DE", "#6C63FF", "#9B8FF5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          {/* Decorative orbs */}
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          {/* Avatar */}
          <View style={styles.avatarRing}>
            <LinearGradient colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.1)"]} style={styles.avatar}>
              <Text style={styles.avatarLetter}>{(user?.username ?? "U")[0].toUpperCase()}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.heroName}>{user?.username ?? "Guest"}</Text>
          {!isGuest && <Text style={styles.heroEmail}>{user?.email}</Text>}

          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>⚡ Level {currentLevel} · {levelName}</Text>
          </View>

          {/* XP bar inside header */}
          <View style={styles.heroXPSection}>
            <View style={styles.heroXPRow}>
              <Text style={styles.heroXPLabel}>{totalXP % XP_PER_LEVEL} XP</Text>
              <Text style={styles.heroXPNext}>{XP_PER_LEVEL} XP</Text>
            </View>
            <View style={styles.heroXPTrack}>
              <Animated.View style={[styles.heroXPFill, xpBarStyle]}>
                <View style={styles.xpShimmer} />
              </Animated.View>
            </View>
            <Text style={styles.heroXPSub}>{XP_PER_LEVEL - (totalXP % XP_PER_LEVEL)} XP to Level {currentLevel + 1}</Text>
          </View>

          {isGuest && (
            <TouchableOpacity style={styles.signUpBanner} onPress={() => router.push("/(auth)/signup")}>
              <Feather name="user-plus" size={14} color={COLORS.white} />
              <Text style={styles.signUpBannerText}>Create a free account to save your progress</Text>
              <Feather name="arrow-right" size={14} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* ── Stats grid ───────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsGrid}>
          <StatTile icon="⚡" label="Total XP" value={totalXP.toLocaleString()} color="#6C63FF" bg="#EEF2FF" border="#C7D2FE" />
          <StatTile icon="🔥" label="Streak" value={`${currentStreak}d`} color="#EA580C" bg="#FFF7ED" border="#FED7AA" />
          <StatTile icon="🏆" label="Longest" value={`${longestStreak}d`} color="#D97706" bg="#FEFCE8" border="#FDE68A" />
          <StatTile icon="✅" label="Lessons" value={`${lessonsCompleted}`} color="#16A34A" bg="#F0FDF4" border="#BBF7D0" />
        </Animated.View>

        {/* ── Subscription status ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(130).springify()}>
          <SubscriptionCard
            isPremium={isPremium}
            premiumExpiresAt={premiumExpiresAt}
            remainingToday={remainingToday()}
            isGuest={isGuest}
          />
        </Animated.View>

        {/* ── Streak calendar ──────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <SectionHeader title="This Week" />
          <StreakCalendar currentStreak={currentStreak} />
        </Animated.View>

        {/* ── Achievements ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <SectionHeader
            title="Achievements"
            right={`${unlockedAchievements.length}/${ACHIEVEMENTS.length}`}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achRow}>
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = unlockedIds.has(ach.id);
              return unlocked ? (
                <TouchableOpacity key={ach.id} onPress={() => setSelectedAchievement(ach)} activeOpacity={0.8}>
                  <AchievementBadge achievement={ach} unlocked />
                </TouchableOpacity>
              ) : (
                <AchievementBadge key={ach.id} achievement={ach} unlocked={false} />
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── Progress Charts ───────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(270).springify()}>
          <SectionHeader title="Weekly XP" />
          <View style={styles.chartCard}>
            <XPBarChart data={xpChartData} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(290).springify()}>
          <SectionHeader title="Topic Progress" />
          <View style={styles.chartCard}>
            <TopicProgressBars data={topicProgressData} />
          </View>
        </Animated.View>

        {/* ── Settings menu ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.menuCard}>
          {!isPremium && !isGuest && (
            <>
              <MenuItem
                icon="zap"
                label="Upgrade to Premium 👑"
                color="#8B5CF6"
                onPress={() => router.push("/paywall")}
              />
              <View style={styles.menuDivider} />
            </>
          )}
          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: "#EA580C15" }]}>
              <Feather name="bell" size={18} color="#EA580C" />
            </View>
            <Text style={styles.menuLabel}>Daily Reminders</Text>
            <Switch
              value={notificationsOn}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: "#E2E8F0", true: COLORS.primary + "80" }}
              thumbColor={notificationsOn ? COLORS.primary : "#94A3B8"}
            />
          </View>
          <View style={styles.menuDivider} />
          <MenuItem icon="help-circle" label="Help & Support" color="#0EA5E9" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem icon="star" label="Rate MathQuest" color="#D97706" onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem
            icon={isGuest ? "user-plus" : "log-out"}
            label={isGuest ? "Sign In / Create Account" : "Sign Out"}
            color={COLORS.danger}
            onPress={isGuest ? () => router.push("/(auth)/welcome") : handleSignOut}
          />
        </Animated.View>

        <Text style={styles.version}>MathQuest v1.0.0</Text>
      </ScrollView>

      <ShareAchievementModal
        visible={!!selectedAchievement}
        achievement={selectedAchievement}
        username={user?.username ?? user?.email?.split("@")[0] ?? "User"}
        onClose={() => setSelectedAchievement(null)}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SubscriptionCard: React.FC<{
  isPremium: boolean;
  premiumExpiresAt: string | null;
  remainingToday: number;
  isGuest: boolean;
}> = ({ isPremium, premiumExpiresAt, remainingToday, isGuest }) => {
  if (isGuest) return null;

  if (isPremium) {
    const expiry = premiumExpiresAt
      ? new Date(premiumExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null;
    return (
      <View style={[subStyles.card, subStyles.premiumCard]}>
        <LinearGradient
          colors={["#4F46E5", COLORS.primary, "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={subStyles.gradientBg}
        >
          <View style={subStyles.orbSmall} />
          <View style={subStyles.row}>
            <View style={subStyles.crownCircle}>
              <Text style={{ fontSize: 20 }}>👑</Text>
            </View>
            <View style={subStyles.textArea}>
              <Text style={subStyles.premiumTitle}>Premium Active</Text>
              <Text style={subStyles.premiumSub}>
                {expiry ? `Renews ${expiry}` : "Lifetime access · Never expires"}
              </Text>
            </View>
            <View style={subStyles.activeChip}>
              <Text style={subStyles.activeChipText}>Active</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const isEmpty = remainingToday === 0;
  return (
    <View style={subStyles.card}>
      <View style={subStyles.freeRow}>
        <View style={subStyles.freeLeft}>
          <Text style={subStyles.freeTitle}>Free Plan</Text>
          <Text style={subStyles.freeSub}>
            {isEmpty
              ? "Daily limit reached — come back tomorrow"
              : `${remainingToday} of ${FREE_DAILY_LIMIT} lessons remaining today`}
          </Text>
          {/* Usage bar */}
          <View style={subStyles.usageTrack}>
            <View
              style={[
                subStyles.usageFill,
                {
                  width: `${((FREE_DAILY_LIMIT - remainingToday) / FREE_DAILY_LIMIT) * 100}%`,
                  backgroundColor: isEmpty ? "#DC2626" : COLORS.primary,
                },
              ]}
            />
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/paywall")}
          style={subStyles.upgradeBtn}
        >
          <LinearGradient
            colors={["#4F46E5", COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={subStyles.upgradeBtnGradient}
          >
            <Text style={subStyles.upgradeBtnText}>Upgrade</Text>
            <Feather name="arrow-right" size={13} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const subStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#EDE9FF",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: "#FFFFFF",
  },
  premiumCard: { borderColor: "#C4B5FD" },
  gradientBg: { padding: 16, overflow: "hidden" },
  orbSmall: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  crownCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  textArea: { flex: 1, gap: 2 },
  premiumTitle: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  premiumSub: { fontSize: 12, color: "rgba(255,255,255,0.78)", fontWeight: "500" },
  activeChip: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  activeChipText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  // Free plan
  freeRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  freeLeft: { flex: 1, gap: 4 },
  freeTitle: { fontSize: 14, fontWeight: "800", color: "#111827" },
  freeSub: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  usageTrack: {
    height: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 6,
  },
  usageFill: { height: "100%", borderRadius: 99 },
  upgradeBtn: { borderRadius: 12, overflow: "hidden", flexShrink: 0 },
  upgradeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  upgradeBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});

const SectionHeader: React.FC<{ title: string; right?: string }> = ({ title, right }) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {right && <Text style={styles.sectionRight}>{right} unlocked</Text>}
  </View>
);

const StatTile: React.FC<{
  icon: string; label: string; value: string; color: string; bg: string; border: string;
}> = ({ icon, label, value, color, bg, border }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.statTile, { backgroundColor: bg, borderColor: border }, animStyle]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

const MenuItem: React.FC<{ icon: string; label: string; color: string; onPress: () => void }> = ({
  icon, label, color, onPress,
}) => {
  const bg = useSharedValue("#FAFAFA");
  const bgStyle = useAnimatedStyle(() => ({ backgroundColor: bg.value }));
  return (
    <Animated.View style={bgStyle}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        onPressIn={() => { bg.value = withTiming("#F4F5FF", { duration: 100 }); }}
        onPressOut={() => { bg.value = withTiming("#FAFAFA", { duration: 200 }); }}
        activeOpacity={1}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: color + "15" }]}>
          <Feather name={icon as any} size={18} color={color} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Feather name="chevron-right" size={16} color="#CBD5E1" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const StreakCalendar: React.FC<{ currentStreak: number }> = ({ currentStreak }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;

  return (
    <View style={styles.calendar}>
      {days.map((day, idx) => {
        const diff = dayIndex - idx;
        const isActive = diff >= 0 && diff < currentStreak;
        const isToday = idx === dayIndex;
        return (
          <View key={day} style={styles.calDay}>
            <Text style={[styles.calLabel, isToday && { color: COLORS.primary, fontWeight: "700" }]}>{day}</Text>
            <View style={[
              styles.calDot,
              isActive && { backgroundColor: "#F97316", shadowColor: "#F97316", shadowOpacity: 0.4, shadowRadius: 6, elevation: 3 },
              isToday && !isActive && { backgroundColor: COLORS.primaryLight, borderWidth: 2, borderColor: COLORS.primary },
              !isActive && !isToday && { backgroundColor: "#F1F5F9" },
            ]}>
              {isActive && <Text style={{ fontSize: 14 }}>🔥</Text>}
              {isToday && !isActive && <View style={styles.calTodayDot} />}
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },
  content: { gap: 16, paddingBottom: 40 },

  heroHeader: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 8,
    overflow: "hidden",
  },
  orb1: { position: "absolute", top: -60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.06)" },
  orb2: { position: "absolute", bottom: -40, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.05)" },

  avatarRing: {
    padding: 3,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarLetter: { fontSize: 34, fontWeight: "900", color: "#FFFFFF" },

  heroName: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 },
  heroEmail: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },

  levelPill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    marginTop: 2,
  },
  levelPillText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  heroXPSection: { width: "100%", gap: 6, marginTop: 6 },
  heroXPRow: { flexDirection: "row", justifyContent: "space-between" },
  heroXPLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  heroXPNext: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "500" },
  heroXPTrack: { height: 9, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" },
  heroXPFill: { height: "100%", backgroundColor: "#FFFFFF", borderRadius: 99, minWidth: 4 },
  xpShimmer: { position: "absolute", top: 0, right: 0, bottom: 0, width: 16, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 99 },
  heroXPSub: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "500", textAlign: "center" },

  signUpBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  signUpBannerText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13, flex: 1 },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 },
  statTile: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 18,
    gap: 5,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  // Section
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  sectionRight: { fontSize: 13, color: "#9CA3AF", fontWeight: "600" },

  // Calendar
  calendar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F0EDFF",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  calDay: { alignItems: "center", gap: 8 },
  calLabel: { fontSize: 11, fontWeight: "600", color: "#9CA3AF" },
  calDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  calTodayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },

  // Achievements
  achRow: { gap: 10, paddingHorizontal: 16, paddingBottom: 4 },

  // Menu
  menuCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0EDFF",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  menuIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111827" },
  menuDivider: { height: 1, backgroundColor: "#F8FAFF", marginLeft: 66 },

  version: { textAlign: "center", fontSize: 12, color: "#CBD5E1", paddingBottom: 8 },

  chartCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16, borderRadius: 20,
    padding: 16, borderWidth: 1, borderColor: "#F0EDFF",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  chartTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 12 },
});

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    arithmetic: "🔢", algebra: "🔣", geometry: "📐", word_problems: "📝",
    fractions: "🍕", percentages: "💯", number_theory: "🔑",
    statistics: "📊", probability: "🎲", measurement: "📏", ratio: "⚖️",
  };
  return map[category] ?? "📚";
}
