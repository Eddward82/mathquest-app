import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "../src/store/authStore";
import { useSubscriptionStore, PLANS, PlanId, Plan } from "../src/store/subscriptionStore";
import { Alert } from "react-native";
import { COLORS, BORDER_RADIUS } from "../src/constants/theme";

const PERKS = [
  { icon: "infinity", label: "Unlimited lessons every day" },
  { icon: "zap", label: "Double XP on every question" },
  { icon: "trending-up", label: "Advanced adaptive difficulty" },
  { icon: "cpu", label: "Unlimited AI tutor explanations" },
  { icon: "award", label: "Exclusive premium badges" },
  { icon: "bar-chart-2", label: "Detailed progress analytics" },
];

export default function PaywallScreen() {
  const { user } = useAuthStore();
  const { activatePremium, isPremium } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("yearly");
  const [isLoading, setIsLoading] = useState(false);

  // Crown pulse
  const crownScale = useSharedValue(1);
  useEffect(() => {
    crownScale.value = withRepeat(
      withSequence(
        withSpring(1.12, { stiffness: 180, damping: 10 }),
        withSpring(1, { stiffness: 180, damping: 10 })
      ),
      -1,
      true
    );
  }, []);
  const crownStyle = useAnimatedStyle(() => ({ transform: [{ scale: crownScale.value }] }));

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!user) return;
    setErrorMsg(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLoading(true);
    try {
      await activatePremium(user.id, selectedPlan);
      router.back();
    } catch (e: any) {
      setErrorMsg(e.message ?? "Purchase failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const { restorePurchases } = useSubscriptionStore.getState();
      const result = await restorePurchases();
      if (result.success) {
        router.back();
      } else {
        setErrorMsg("No active subscription found to restore.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Close button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.closeBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Feather name="x" size={20} color="#6B7280" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        bounces={false}
      >
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#4F46E5", COLORS.primary, "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Decorative orbs */}
          <View style={[styles.orb, { top: -40, left: -40, width: 140, height: 140 }]} />
          <View style={[styles.orb, { bottom: -30, right: -30, width: 100, height: 100 }]} />

          <Animated.View style={[styles.crownCircle, crownStyle]}>
            <Text style={styles.crownEmoji}>👑</Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(80).springify()} style={styles.heroTitle}>
            MathQuest Premium
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(140).springify()} style={styles.heroSub}>
            Unlock your full potential with unlimited learning
          </Animated.Text>
        </LinearGradient>

        {/* ── Perks list ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Everything in Premium</Text>
          <View style={styles.perksList}>
            {PERKS.map((perk, i) => (
              <Animated.View
                key={perk.icon}
                entering={FadeInDown.delay(i * 50 + 60).springify()}
                style={styles.perkRow}
              >
                <View style={styles.perkIcon}>
                  <Feather name={perk.icon as any} size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.perkLabel}>{perk.label}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── Plan selector ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your plan</Text>
          <View style={styles.plansRow}>
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPlan(plan.id);
                }}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.ctaArea}>
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={isLoading}
            activeOpacity={0.88}
            style={styles.ctaBtn}
          >
            <LinearGradient
              colors={["#4F46E5", COLORS.primary, "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {isLoading ? (
                <Text style={styles.ctaText}>Processing…</Text>
              ) : (
                <>
                  <Feather name="zap" size={18} color="#FFFFFF" />
                  <Text style={styles.ctaText}>
                    Start Premium · {selectedPlanData.price}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            {"Cancel anytime · Billed " + (selectedPlan === "monthly" ? "monthly" : "annually")}
          </Text>

          {errorMsg && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          <TouchableOpacity onPress={handleRestore} disabled={isLoading} style={styles.skipBtn}>
            <Text style={styles.restoreText}>Restore purchases</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
            <Text style={styles.skipText}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── PlanCard ──────────────────────────────────────────────────────────────────
const PlanCard: React.FC<{ plan: Plan; selected: boolean; onPress: () => void }> = ({
  plan, selected, onPress,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.planCardWrap, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { stiffness: 500 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 500 }); }}
        activeOpacity={1}
        style={[
          styles.planCard,
          selected && styles.planCardSelected,
          plan.highlight && !selected && styles.planCardHighlight,
        ]}
      >
        {plan.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{plan.badge}</Text>
          </View>
        )}

        {selected && (
          <View style={styles.checkCircle}>
            <Feather name="check" size={12} color="#FFFFFF" />
          </View>
        )}

        <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>
          {plan.label}
        </Text>
        <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
          {plan.price}
        </Text>
        <Text style={[styles.planPer, selected && styles.planPerSelected]}>
          {plan.perMonth}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F5FF" },

  closeBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? 48 : 56,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  scroll: { paddingBottom: 16 },

  // Hero
  hero: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 72 : 80,
    paddingBottom: 36,
    paddingHorizontal: 24,
    overflow: "hidden",
    gap: 12,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  crownCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 4,
  },
  crownEmoji: { fontSize: 44 },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },

  // Section
  section: { paddingHorizontal: 20, paddingTop: 24, gap: 14 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },

  // Perks
  perksList: { gap: 10 },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EDE9FF",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  perkIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  perkLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1F2937" },

  // Plans
  plansRow: { flexDirection: "row", gap: 10 },
  planCardWrap: { flex: 1 },
  planCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 4,
    minHeight: 110,
    justifyContent: "center",
    overflow: "visible",
  },
  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#EDE9FF",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  planCardHighlight: {
    borderColor: "#C4B5FD",
    backgroundColor: "#F5F3FF",
  },
  badge: {
    position: "absolute",
    top: -10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  checkCircle: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  planLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  planLabelSelected: { color: COLORS.primary },
  planPrice: { fontSize: 20, fontWeight: "900", color: "#111827", letterSpacing: -0.5 },
  planPriceSelected: { color: COLORS.primary },
  planPer: { fontSize: 11, fontWeight: "600", color: "#9CA3AF" },
  planPerSelected: { color: COLORS.primary },

  // CTA
  ctaArea: { paddingHorizontal: 20, paddingTop: 24, gap: 12, alignItems: "center" },
  ctaBtn: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "900", fontSize: 17, letterSpacing: -0.2 },
  legalText: { fontSize: 12, color: "#9CA3AF", fontWeight: "500", textAlign: "center" },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 20 },
  skipText: { fontSize: 14, color: "#9CA3AF", fontWeight: "600" },
  restoreText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  errorText: { fontSize: 13, color: "#EF4444", fontWeight: "500", textAlign: "center" },
});
