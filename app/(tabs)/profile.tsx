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
  Linking,
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
  FadeInDown,
  Easing,
} from "react-native-reanimated";
import { useAuthStore, getSignInMethod, isDeletionCancelled } from "../../src/store/authStore";
import Constants from "expo-constants";
import { useProgressStore } from "../../src/store/progressStore";
import { scheduleDailyStreakReminder, cancelDailyStreakReminder, requestNotificationPermission } from "../../src/lib/notifications";
import { useSubscriptionStore, FREE_LIFETIME_LIMIT } from "../../src/store/subscriptionStore";
import { ACHIEVEMENTS } from "../../src/data/achievements";
import { TOPICS } from "../../src/data/lessons";
import { LEVEL_NAMES, XP_PER_LEVEL } from "../../src/constants/theme";
import { ShareAchievementModal } from "../../src/components/ui/ShareAchievementModal";
import { ConfirmPasswordModal } from "../../src/components/profile/ConfirmPasswordModal";
import { Achievement } from "../../src/types";

const { width } = Dimensions.get("window");

const BRAND = "#6C5CE7";
const BRAND_SOFT = "#EDE9FE";
const INK = "#0F172A";
const BODY = "#1E293B";
const MUTED = "#64748B";
const FAINT = "#94A3B8";
const LINE = "#E2E8F0";
const DANGER = "#DC2626";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProfileScreen() {
  const { user, signOut, deleteAccount, isGuest } = useAuthStore();
  const {
    totalXP, currentLevel, currentStreak, longestStreak,
    lessonsCompleted, unlockedAchievements, loadProgress, completedLessonIds,
  } = useProgressStore();
  const { isPremium, premiumExpiresAt, remainingToday } = useSubscriptionStore();
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const xpInLevel = totalXP % XP_PER_LEVEL;
  const xpBarWidth = useSharedValue(0);
  const xpBarStyle = useAnimatedStyle(() => ({ width: `${xpBarWidth.value}%` }));

  useEffect(() => {
    if (user) loadProgress(user.id);
  }, [user]);

  useEffect(() => {
    const pct = (xpInLevel / XP_PER_LEVEL) * 100;
    xpBarWidth.value = withDelay(400, withTiming(pct, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [xpInLevel]);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your progress. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (getSignInMethod() === "password") {
              setDeleteError(null);
              setPasswordPromptOpen(true);
            } else {
              runDeleteAccount();
            }
          },
        },
      ]
    );
  };

  const runDeleteAccount = async (password?: string) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(password);
      setPasswordPromptOpen(false);
      router.replace("/(auth)/welcome");
    } catch (err: any) {
      if (isDeletionCancelled(err)) return;
      const message = err?.message ?? "Something went wrong. Please try again.";
      // Password errors show inline; anything else (e.g. Google) as an alert.
      if (password !== undefined) setDeleteError(message);
      else Alert.alert("Couldn't delete account", message);
    } finally {
      setDeleting(false);
    }
  };

  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const levelName = LEVEL_NAMES[currentLevel] ?? "Mathlete";
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon = 0

  // Achievements: unlocked first, then locked, in catalogue order.
  const sortedAchievements = React.useMemo(
    () => [
      ...ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)),
      ...ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id)),
    ],
    [unlockedAchievements],
  );

  // Weekly XP — per-day XP isn't stored, so this is estimated from the streak
  // and the average XP per lesson (same estimate the old chart used).
  const xpChartData = React.useMemo(() => {
    const xpPerLesson = lessonsCompleted > 0 ? Math.round(totalXP / lessonsCompleted) : 0;
    return DAYS.map((label, i) => {
      const diff = todayIdx - i;
      if (diff === 0) return { label, xp: xpInLevel > 0 ? xpInLevel : xpPerLesson };
      if (diff > 0 && diff < currentStreak) return { label, xp: xpPerLesson };
      return { label, xp: 0 };
    });
  }, [totalXP, currentStreak, lessonsCompleted, todayIdx, xpInLevel]);

  const topicRows = TOPICS.map((t) => ({
    id: t.id,
    label: t.title,
    emoji: getCategoryEmoji(t.category),
    color: t.color,
    completed: t.lessons.filter((l) => completedLessonIds.has(l.id)).length,
    total: t.lessons.length,
  }));

  const name = user?.username ?? "Guest";
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const build = Constants.expoConfig?.android?.versionCode;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
          <Text style={styles.pageSub}>Your progress, badges &amp; settings</Text>
        </View>

        {/* ── Identity & level card ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.springify()} style={styles.identityCard}>
          <View style={styles.identityGlow1} />
          <View style={styles.identityGlow2} />

          <LinearGradient
            colors={["#A78BFA", "#8B5CF6", BRAND]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarLetter}>{name[0]?.toUpperCase() ?? "U"}</Text>
          </LinearGradient>

          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {!isGuest && !!user?.email && (
            <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
          )}

          <View style={styles.levelPill}>
            <Feather name="zap" size={14} color="#F59E0B" />
            <Text style={styles.levelPillText}>Level {currentLevel} • {levelName}</Text>
          </View>

          <View style={styles.meter}>
            <View style={styles.meterLabels}>
              <Text style={styles.meterNow}>{xpInLevel} XP</Text>
              <Text style={styles.meterMax}>{XP_PER_LEVEL} XP</Text>
            </View>
            <View style={styles.meterTrack}>
              <Animated.View style={[styles.meterFillWrap, xpBarStyle]}>
                <LinearGradient
                  colors={[BRAND, "#A78BFA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          </View>
          <Text style={styles.meterHint}>
            {XP_PER_LEVEL - xpInLevel} XP needed to reach Level {currentLevel + 1}
          </Text>

          <PlanBanner
            isGuest={isGuest}
            isPremium={isPremium}
            premiumExpiresAt={premiumExpiresAt}
            remaining={remainingToday()}
          />
        </Animated.View>

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.statsGrid}>
          <StatCard icon="zap" tint="#6C5CE7" tag="ALL TIME" value={totalXP.toLocaleString()} label="Total XP" />
          <StatCard
            icon="activity"
            tint="#EA580C"
            tag={currentStreak > 0 ? "ACTIVE" : "START TODAY"}
            tagColor={currentStreak > 0 ? "#EA580C" : undefined}
            value={String(currentStreak)}
            unit="d"
            label="Current Streak"
            emoji="🔥"
          />
          <StatCard icon="award" tint="#D97706" tag="RECORD" value={String(longestStreak)} unit="d" label="Longest Streak" />
          <StatCard icon="check-circle" tint="#059669" tag="PASSED" value={String(lessonsCompleted)} label="Lessons Finished" />
        </Animated.View>

        {/* ── This week ────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Feather name="calendar" size={18} color="#EA580C" />
              <Text style={styles.cardTitle}>This Week</Text>
            </View>
            <Text style={styles.cardMeta}>Week {isoWeek(new Date())}</Text>
          </View>
          <View style={styles.weekRow}>
            {DAYS.map((day, idx) => {
              const diff = todayIdx - idx;
              const active = diff >= 0 && diff < currentStreak;
              const isToday = idx === todayIdx;
              return (
                <View key={day} style={styles.weekDay}>
                  <Text style={[styles.weekLabel, isToday && styles.weekLabelToday]}>{day}</Text>
                  <View
                    style={[
                      styles.weekDot,
                      active && styles.weekDotActive,
                      isToday && !active && styles.weekDotToday,
                    ]}
                  >
                    {active
                      ? <Text style={styles.weekFlame}>🔥</Text>
                      : <View style={[styles.weekPip, isToday && { backgroundColor: BRAND, opacity: 1 }]} />}
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Achievements ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.achSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Achievements</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achRow}
            style={styles.achScroller}
          >
            {sortedAchievements.map((ach) => (
              <AchievementCard
                key={ach.id}
                achievement={ach}
                unlocked={unlockedIds.has(ach.id)}
                onPress={() => setSelectedAchievement(ach)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Weekly XP ────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Weekly XP</Text>
              <Text style={styles.cardSub}>Daily earned experience</Text>
            </View>
            <View style={styles.brandPill}>
              <Text style={styles.brandPillText}>Total: {totalXP.toLocaleString()} XP</Text>
            </View>
          </View>
          <WeeklyBars data={xpChartData} todayIdx={todayIdx} />
        </Animated.View>

        {/* ── Topic mastery ────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Topic Mastery</Text>
              <Text style={styles.cardSub}>Progress across core subjects</Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{TOPICS.length} Topics</Text>
            </View>
          </View>
          <View style={styles.masteryList}>
            {topicRows.map((t) => (
              <MasteryRow key={t.id} {...t} />
            ))}
          </View>
        </Animated.View>

        {/* ── Settings ─────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.settingsCard}>
          {!isPremium && !isGuest && (
            <SettingsRow icon="star" tint="#8B5CF6" label="Upgrade to Premium 👑" onPress={() => router.push("/paywall")} />
          )}
          <View style={styles.settingsRow}>
            <View style={[styles.settingsIcon, { backgroundColor: "#EA580C1F" }]}>
              <Feather name="bell" size={18} color="#EA580C" />
            </View>
            <Text style={styles.settingsLabel}>Daily Reminders</Text>
            <Switch
              value={notificationsOn}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: LINE, true: "#C4B5FD" }}
              thumbColor={notificationsOn ? BRAND : "#F8FAFC"}
            />
          </View>
          <SettingsRow
            icon="help-circle"
            tint="#0EA5E9"
            label="Help & Support"
            onPress={() => Linking.openURL("mailto:support@smartbloomai.org?subject=MathQuest%20Support")}
          />
          <SettingsRow
            icon="thumbs-up"
            tint={BRAND}
            label="Rate MathQuest"
            onPress={() => Linking.openURL("market://details?id=com.mathquestapp.learn")}
          />
          <SettingsRow
            icon={isGuest ? "user-plus" : "log-out"}
            tint={isGuest ? BRAND : DANGER}
            label={isGuest ? "Sign In / Create Account" : "Sign Out"}
            onPress={isGuest ? () => router.push("/(auth)/welcome") : handleSignOut}
          />
          {!isGuest && (
            <SettingsRow icon="trash-2" tint={DANGER} label="Delete Account" danger onPress={handleDeleteAccount} />
          )}
        </Animated.View>

        <Text style={styles.version}>
          MathQuest v{version}{build ? ` • Build ${build}` : ""}
        </Text>
      </ScrollView>

      <ShareAchievementModal
        visible={!!selectedAchievement}
        achievement={selectedAchievement}
        username={user?.username ?? user?.email?.split("@")[0] ?? "User"}
        onClose={() => setSelectedAchievement(null)}
      />

      <ConfirmPasswordModal
        visible={passwordPromptOpen}
        loading={deleting}
        error={deleteError}
        onConfirm={(password) => runDeleteAccount(password)}
        onCancel={() => setPasswordPromptOpen(false)}
      />
    </SafeAreaView>
  );
}

// ── PlanBanner ────────────────────────────────────────────────────────────────

const PlanBanner: React.FC<{
  isGuest: boolean;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  remaining: number;
}> = ({ isGuest, isPremium, premiumExpiresAt, remaining }) => {
  if (isGuest) {
    return (
      <TouchableOpacity onPress={() => router.push("/(auth)/signup")} activeOpacity={0.85} style={styles.planTouch}>
        <LinearGradient colors={["#EDE9FE", "#E0E7FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.plan}>
          <View style={styles.planIcon}>
            <Feather name="user-plus" size={16} color={BRAND} />
          </View>
          <View style={styles.planText}>
            <Text style={styles.planTitle}>Save your progress</Text>
            <Text style={styles.planSub} numberOfLines={1}>Create a free account</Text>
          </View>
          <Feather name="arrow-right" size={16} color={BRAND} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (isPremium) {
    const expiry = premiumExpiresAt
      ? new Date(premiumExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null;
    return (
      <LinearGradient colors={["#EDE9FE", "#E0E7FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.plan, styles.planTouch]}>
        <View style={styles.planIcon}>
          <Text style={styles.planCrown}>👑</Text>
        </View>
        <View style={styles.planText}>
          <Text style={styles.planTitle}>Premium Active</Text>
          <Text style={styles.planSub} numberOfLines={1}>
            {expiry ? `Renews ${expiry}` : "Lifetime access · Never expires"}
          </Text>
        </View>
        <View style={styles.activeChip}>
          <Text style={styles.activeChipText}>Active</Text>
        </View>
      </LinearGradient>
    );
  }

  const isEmpty = remaining === 0;
  const usedPct = ((FREE_LIFETIME_LIMIT - remaining) / FREE_LIFETIME_LIMIT) * 100;
  return (
    <View style={[styles.plan, styles.planFree, styles.planTouch]}>
      <View style={styles.planText}>
        <Text style={styles.planTitle}>Free Plan</Text>
        <Text style={[styles.planSub, isEmpty && { color: DANGER }]} numberOfLines={2}>
          {isEmpty
            ? "Free lesson limit reached — upgrade to continue"
            : `${remaining} of ${FREE_LIFETIME_LIMIT} free lessons remaining`}
        </Text>
        <View style={styles.usageTrack}>
          <View style={[styles.usageFill, { width: `${usedPct}%`, backgroundColor: isEmpty ? DANGER : BRAND }]} />
        </View>
      </View>
      <TouchableOpacity onPress={() => router.push("/paywall")} style={styles.upgradeBtn} activeOpacity={0.85}>
        <Text style={styles.upgradeBtnText}>Upgrade</Text>
        <Feather name="arrow-right" size={13} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  tint: string;
  tag: string;
  tagColor?: string;
  value: string;
  unit?: string;
  label: string;
  emoji?: string;
}> = ({ icon, tint, tag, tagColor, value, unit, label, emoji }) => (
  <View style={styles.statCard}>
    <View style={styles.statTop}>
      <View style={[styles.statIcon, { backgroundColor: tint + "1F" }]}>
        {emoji ? <Text style={styles.statEmoji}>{emoji}</Text> : <Feather name={icon} size={16} color={tint} />}
      </View>
      <Text style={[styles.statTag, tagColor ? { color: tagColor } : null]}>{tag}</Text>
    </View>
    <Text style={styles.statValue}>
      {value}
      {unit && <Text style={styles.statUnit}>{unit}</Text>}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ── AchievementCard ───────────────────────────────────────────────────────────

const AchievementCard: React.FC<{ achievement: Achievement; unlocked: boolean; onPress: () => void }> = ({
  achievement, unlocked, onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!unlocked}
    activeOpacity={0.85}
    style={[styles.achCard, !unlocked && styles.achCardLocked]}
    accessibilityLabel={`${achievement.title}${unlocked ? "" : ", locked"}`}
  >
    <View style={[styles.achIcon, !unlocked && styles.achIconLocked]}>
      <Feather name={achievement.icon as any} size={22} color={unlocked ? BRAND : FAINT} />
      {!unlocked && (
        <View style={styles.achLock}>
          <Feather name="lock" size={10} color={FAINT} />
        </View>
      )}
    </View>
    <Text style={[styles.achTitle, !unlocked && { color: MUTED }]} numberOfLines={1}>{achievement.title}</Text>
    {unlocked ? (
      <Text style={styles.achXp}>+{achievement.xp_reward} XP</Text>
    ) : (
      <Text style={styles.achHint} numberOfLines={2}>{achievement.description}</Text>
    )}
  </TouchableOpacity>
);

// ── WeeklyBars ────────────────────────────────────────────────────────────────

const BAR_MAX = 96;

const WeeklyBars: React.FC<{ data: { label: string; xp: number }[]; todayIdx: number }> = ({ data, todayIdx }) => {
  const max = Math.max(...data.map((d) => d.xp), 1);
  return (
    <View style={styles.bars}>
      {data.map((d, i) => {
        const h = d.xp > 0 ? Math.max(12, (d.xp / max) * BAR_MAX) : 8;
        const isToday = i === todayIdx;
        return (
          <View key={d.label} style={styles.barCol}>
            {d.xp > 0 && (
              <View style={styles.barValue}>
                <Text style={styles.barValueText}>{d.xp}</Text>
              </View>
            )}
            {d.xp > 0 ? (
              <LinearGradient colors={[BRAND, "#C4B5FD"]} style={[styles.bar, { height: h }]} />
            ) : (
              <View style={[styles.bar, styles.barEmpty, { height: h }]} />
            )}
            <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ── MasteryRow ────────────────────────────────────────────────────────────────

const MasteryRow: React.FC<{
  label: string; emoji: string; color: string; completed: number; total: number;
}> = ({ label, emoji, color, completed, total }) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const mastered = pct === 100;
  const barColor = mastered ? BRAND : completed > 0 ? color : LINE;
  const pctColor = mastered ? BRAND : completed > 0 ? color : FAINT;
  return (
    <View style={styles.masteryRow}>
      <View style={styles.masteryTop}>
        <View style={styles.masteryLeft}>
          <View style={styles.masteryEmojiTile}>
            <Text style={styles.masteryEmoji}>{emoji}</Text>
          </View>
          <Text style={styles.masteryLabel} numberOfLines={1}>{label}</Text>
        </View>
        <View style={styles.masteryRight}>
          <Text style={[styles.masteryPct, { color: pctColor }]}>{pct}%</Text>
          {mastered && <Feather name="check-circle" size={15} color={BRAND} />}
        </View>
      </View>
      <View style={styles.masteryTrack}>
        <View style={[styles.masteryFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.masterySub}>{completed} of {total} lessons completed</Text>
    </View>
  );
};

// ── SettingsRow ───────────────────────────────────────────────────────────────

const SettingsRow: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  tint: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
}> = ({ icon, tint, label, danger, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.settingsRow}>
    <View style={[styles.settingsIcon, { backgroundColor: tint + "1F" }]}>
      <Feather name={icon} size={18} color={tint} />
    </View>
    <Text style={[styles.settingsLabel, danger && { color: DANGER }]}>{label}</Text>
    <Feather name="chevron-right" size={18} color={danger ? DANGER : FAINT} />
  </TouchableOpacity>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** ISO-8601 week number (weeks start Monday; week 1 contains Jan 4th). */
function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    arithmetic: "🔢", algebra: "🔣", geometry: "📐", word_problems: "📝",
    fractions: "🍕", percentages: "💯", number_theory: "🔑",
    statistics: "📊", probability: "🎲", measurement: "📏", ratio: "⚖️",
  };
  return map[category] ?? "📚";
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardBase = {
  backgroundColor: "#FFFFFF",
  borderRadius: 20,
  borderWidth: 1,
  borderColor: LINE,
  shadowColor: "#6366F1",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FCFCFF" },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 20 },

  pageHeader: { paddingHorizontal: 4 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: INK, letterSpacing: -0.6 },
  pageSub: { fontSize: 12, color: FAINT, fontWeight: "500", marginTop: 2 },

  // Identity card
  identityCard: {
    ...cardBase,
    alignItems: "center",
    padding: 20,
    overflow: "hidden",
  },
  identityGlow1: {
    position: "absolute", top: -48, right: -48,
    width: 144, height: 144, borderRadius: 72,
    backgroundColor: "rgba(167,139,250,0.14)",
  },
  identityGlow2: {
    position: "absolute", bottom: -40, left: -40,
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: "rgba(129,140,248,0.12)",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarLetter: { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  name: { fontSize: 22, fontWeight: "800", color: INK, letterSpacing: -0.4, maxWidth: "90%" },
  email: { fontSize: 13, color: MUTED, marginTop: 2, maxWidth: 260 },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: "#F1F5F9",
  },
  levelPillText: { fontSize: 13, fontWeight: "700", color: BODY },
  meter: {
    width: "100%",
    marginTop: 16,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },
  meterLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 4,
  },
  meterNow: { fontSize: 12, fontWeight: "700", color: INK },
  meterMax: { fontSize: 12, color: MUTED },
  meterTrack: { height: 10, backgroundColor: "#FFFFFF", borderRadius: 99, overflow: "hidden" },
  meterFillWrap: { height: "100%", borderRadius: 99, overflow: "hidden", minWidth: 4 },
  meterHint: { fontSize: 12, color: MUTED, fontWeight: "500", marginTop: 6 },

  // Plan banner
  planTouch: { width: "100%", marginTop: 16 },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  planFree: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: LINE },
  planIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  planCrown: { fontSize: 15 },
  planText: { flex: 1, minWidth: 0 },
  planTitle: { fontSize: 13, fontWeight: "700", color: INK },
  planSub: { fontSize: 12, color: MUTED, marginTop: 1 },
  activeChip: { backgroundColor: BRAND, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  activeChipText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  usageTrack: { height: 5, backgroundColor: LINE, borderRadius: 99, overflow: "hidden", marginTop: 8 },
  usageFill: { height: "100%", borderRadius: 99 },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  upgradeBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    ...cardBase,
    width: (width - 44) / 2,
    padding: 14,
    borderRadius: 18,
  },
  statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statEmoji: { fontSize: 15 },
  statTag: { fontSize: 10, fontWeight: "700", color: FAINT, letterSpacing: 0.6 },
  statValue: { fontSize: 24, fontWeight: "800", color: INK, marginTop: 10, letterSpacing: -0.5 },
  statUnit: { fontSize: 15, fontWeight: "400", color: MUTED },
  statLabel: { fontSize: 10, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 1 },

  // Cards
  card: { ...cardBase, padding: 16 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: INK, letterSpacing: -0.2 },
  cardSub: { fontSize: 12, color: MUTED, marginTop: 1 },
  cardMeta: { fontSize: 12, color: MUTED, fontWeight: "500" },
  countPill: { backgroundColor: "#F1F5F9", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  countPillText: { fontSize: 11, fontWeight: "600", color: MUTED },
  brandPill: { backgroundColor: BRAND_SOFT, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  brandPillText: { fontSize: 11, fontWeight: "700", color: BRAND },

  // Week
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: { alignItems: "center", gap: 6 },
  weekLabel: { fontSize: 11, color: MUTED, fontWeight: "500" },
  weekLabelToday: { color: BRAND, fontWeight: "800" },
  weekDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  weekDotActive: {
    backgroundColor: "#FDBA74",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  weekDotToday: { backgroundColor: BRAND_SOFT, borderWidth: 2, borderColor: BRAND },
  weekFlame: { fontSize: 17 },
  weekPip: { width: 8, height: 8, borderRadius: 4, backgroundColor: FAINT, opacity: 0.4 },

  // Achievements
  achSection: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  achScroller: { marginHorizontal: -16 },
  achRow: { gap: 12, paddingHorizontal: 16, paddingVertical: 4 },
  achCard: {
    ...cardBase,
    width: 120,
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
  },
  achCardLocked: { backgroundColor: "#F8FAFC", shadowOpacity: 0, elevation: 0 },
  achIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: BRAND_SOFT,
    alignItems: "center", justifyContent: "center",
  },
  achIconLocked: { backgroundColor: "#EEF2F6" },
  achLock: {
    position: "absolute", top: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: LINE,
    alignItems: "center", justifyContent: "center",
  },
  achTitle: { fontSize: 12, fontWeight: "700", color: INK, marginTop: 8, maxWidth: "100%" },
  achXp: { fontSize: 11, fontWeight: "700", color: BRAND, marginTop: 2 },
  achHint: { fontSize: 10, color: FAINT, marginTop: 2, textAlign: "center", lineHeight: 13 },

  // Weekly bars
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: BAR_MAX + 52,
    paddingHorizontal: 4,
  },
  barCol: { flex: 1, alignItems: "center" },
  barValue: {
    backgroundColor: BRAND_SOFT,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 4,
  },
  barValueText: { fontSize: 10, fontWeight: "800", color: BRAND },
  bar: { width: 26, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barEmpty: { backgroundColor: "#EEF2F6" },
  barLabel: { fontSize: 11, color: MUTED, marginTop: 8 },
  barLabelToday: { color: BRAND, fontWeight: "800" },

  // Mastery
  masteryList: { gap: 14 },
  masteryRow: { gap: 6 },
  masteryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  masteryLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  masteryEmojiTile: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center", justifyContent: "center",
  },
  masteryEmoji: { fontSize: 14 },
  masteryLabel: { flexShrink: 1, fontSize: 13, fontWeight: "700", color: INK },
  masteryRight: { flexDirection: "row", alignItems: "center", gap: 5 },
  masteryPct: { fontSize: 12, fontWeight: "800" },
  masteryTrack: { height: 8, backgroundColor: "#F1F5F9", borderRadius: 99, overflow: "hidden" },
  masteryFill: { height: "100%", borderRadius: 99 },
  masterySub: { fontSize: 11, color: MUTED },

  // Settings
  settingsCard: { ...cardBase, padding: 6 },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
  },
  settingsIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: INK },

  version: { textAlign: "center", fontSize: 12, color: FAINT },
});
