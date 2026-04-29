import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
import { COLORS, BORDER_RADIUS } from "../../src/constants/theme";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  { icon: "🔥", title: "Daily Streaks", desc: "Build a habit and stay consistent. Your streak tracks every day you show up." },
  { icon: "⚡", title: "Earn XP", desc: "Every correct answer rewards you with XP. Watch your level rise as you learn." },
  { icon: "🤖", title: "AI Tutor", desc: "Stuck on a question? Your AI tutor explains it instantly, in plain English." },
  { icon: "🏆", title: "Achievements", desc: "Unlock badges and milestones as you master new topics and hit your goals." },
  { icon: "📈", title: "Progress Tracking", desc: "See exactly how far you've come across every topic with detailed analytics." },
  { icon: "♾️", title: "Unlimited Lessons", desc: "Premium members get unlimited lessons every day with double XP rewards." },
];

const STEPS = [
  { num: "1", title: "Create your account", desc: "Sign up free in under 60 seconds with email or Google." },
  { num: "2", title: "Pick your topics", desc: "Choose from arithmetic, algebra, geometry, and more." },
  { num: "3", title: "Complete lessons", desc: "Answer questions, earn XP, and get AI help when needed." },
  { num: "4", title: "Track your growth", desc: "Watch your level rise and your streak grow every day." },
];

export default function WelcomeScreen() {
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const heroTranslate = useSharedValue(30);

  useEffect(() => {
    logoScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 120 }));
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    heroOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    heroTranslate.value = withDelay(300, withSpring(0, { damping: 16, stiffness: 150 }));

    float1.value = withRepeat(
      withSequence(withTiming(-14, { duration: 2800, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.sin) })),
      -1, true
    );
    float2.value = withRepeat(
      withSequence(withTiming(18, { duration: 3400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 3400, easing: Easing.inOut(Easing.sin) })),
      -1, true
    );
    float3.value = withRepeat(
      withSequence(withTiming(-10, { duration: 4000, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) })),
      -1, true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslate.value }],
  }));
  const bubble1Style = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }] }));
  const bubble2Style = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }] }));
  const bubble3Style = useAnimatedStyle(() => ({ transform: [{ translateY: float3.value }] }));

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── HERO SECTION ─────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={["#4C35DE", "#6C63FF", "#9B8FF5"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Orbs */}
          <View style={styles.orbTop} />
          <View style={styles.orbBottom} />

          {/* Floating symbols */}
          <Animated.View style={[styles.bubble, { top: height * 0.06, left: 24, width: 64, height: 64, opacity: 0.25 }, bubble1Style]}>
            <Text style={[styles.bubbleText, { fontSize: 28 }]}>∑</Text>
          </Animated.View>
          <Animated.View style={[styles.bubble, { top: height * 0.12, right: 28, width: 50, height: 50, opacity: 0.2 }, bubble2Style]}>
            <Text style={[styles.bubbleText, { fontSize: 22 }]}>π</Text>
          </Animated.View>
          <Animated.View style={[styles.bubble, { top: height * 0.2, left: 60, width: 40, height: 40, opacity: 0.16 }, bubble3Style]}>
            <Text style={[styles.bubbleText, { fontSize: 17 }]}>√</Text>
          </Animated.View>

          <SafeAreaView style={styles.heroInner}>
            {/* Logo */}
            <Animated.View style={[styles.logoWrapper, logoStyle]}>
              <LinearGradient
                colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.15)"]}
                style={styles.logoGlass}
              >
                <Text style={styles.logoEmoji}>🧮</Text>
              </LinearGradient>
              <View style={styles.logoGlow} />
            </Animated.View>

            {/* Badge */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.badge}>
              <Text style={styles.badgeText}>🎉 Free to download</Text>
            </Animated.View>

            {/* Title */}
            <Animated.View style={[styles.titleBlock, heroStyle]}>
              <Text style={styles.appName}>MathQuest</Text>
              <Text style={styles.tagline}>
                Learn Maths. Earn XP.{"\n"}Level Up Every Day.
              </Text>
            </Animated.View>

            {/* Feature pills */}
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.pillsRow}>
              {[
                { icon: "🔥", label: "Streaks" },
                { icon: "⚡", label: "Earn XP" },
                { icon: "🤖", label: "AI Tutor" },
                { icon: "🏆", label: "Badges" },
              ].map((f) => (
                <View key={f.label} style={styles.pill}>
                  <Text style={styles.pillIcon}>{f.icon}</Text>
                  <Text style={styles.pillText}>{f.label}</Text>
                </View>
              ))}
            </Animated.View>

            {/* CTA Buttons */}
            <Animated.View entering={FadeInDown.delay(550).springify()} style={styles.cta}>
              <PressableButton
                label="Get Started Free →"
                onPress={() => router.push("/(auth)/signup")}
                primary
              />
              <PressableButton
                label="I already have an account"
                onPress={() => router.push("/(auth)/login")}
              />
            </Animated.View>
          </SafeAreaView>
        </View>

        {/* ── FEATURES SECTION ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>FEATURES</Text>
          </View>
          <Text style={styles.sectionTitle}>Everything you need{"\n"}to master maths</Text>
          <Text style={styles.sectionSub}>
            MathQuest combines gamification and AI to make learning genuinely enjoyable.
          </Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <Animated.View
                key={f.title}
                entering={FadeInDown.delay(i * 60).springify()}
                style={styles.featureCard}
              >
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <View style={[styles.section, styles.sectionAlt]}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>HOW IT WORKS</Text>
          </View>
          <Text style={styles.sectionTitle}>Start learning{"\n"}in minutes</Text>
          <View style={styles.stepsList}>
            {STEPS.map((step, i) => (
              <Animated.View
                key={step.num}
                entering={FadeInDown.delay(i * 80).springify()}
                style={styles.stepRow}
              >
                <LinearGradient
                  colors={["#4C35DE", "#6C63FF"]}
                  style={styles.stepNum}
                >
                  <Text style={styles.stepNumText}>{step.num}</Text>
                </LinearGradient>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── PRICING SECTION ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>PRICING</Text>
          </View>
          <Text style={styles.sectionTitle}>Simple pricing,{"\n"}big results</Text>
          <Text style={styles.sectionSub}>Start free. Upgrade when you're ready.</Text>

          <View style={styles.pricingRow}>
            {/* Free card */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingLabel}>Free</Text>
              <Text style={styles.pricingPrice}>$0</Text>
              <Text style={styles.pricingPer}>forever</Text>
              <View style={styles.pricingFeatures}>
                {["5 lessons per day", "Basic progress tracking", "XP & streaks"].map((f) => (
                  <View key={f} style={styles.pricingFeatureRow}>
                    <Text style={styles.checkIcon}>✓</Text>
                    <Text style={styles.pricingFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Premium card */}
            <LinearGradient colors={["#4C35DE", "#6C63FF"]} style={styles.pricingCardPremium}>
              <View style={styles.pricingBadge}>
                <Text style={styles.pricingBadgeText}>Best Value</Text>
              </View>
              <Text style={styles.pricingLabelPremium}>Premium</Text>
              <Text style={styles.pricingPricePremium}>$4</Text>
              <Text style={styles.pricingPerPremium}>/month (billed yearly)</Text>
              <View style={styles.pricingFeatures}>
                {["Unlimited lessons", "Double XP rewards", "AI tutor help", "Exclusive badges", "Advanced analytics"].map((f) => (
                  <View key={f} style={styles.pricingFeatureRow}>
                    <Text style={[styles.checkIcon, { color: "#FFD700" }]}>✓</Text>
                    <Text style={[styles.pricingFeatureText, { color: "#fff" }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#4C35DE", "#6C63FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottomCta}
        >
          <Text style={styles.bottomCtaTitle}>Ready to level up?</Text>
          <Text style={styles.bottomCtaSub}>
            Join MathQuest free today. Your first lesson takes just 5 minutes.
          </Text>
          <PressableButton
            label="Create Free Account →"
            onPress={() => router.push("/(auth)/signup")}
            primary
            light
          />
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>🧮 MathQuest</Text>
          <Text style={styles.footerText}>
            &copy; 2026 MathQuest. All rights reserved.
          </Text>
          <Text style={styles.footerText}>
            krislove79@gmail.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── PressableButton ───────────────────────────────────────────────────────────
const PressableButton: React.FC<{
  label: string;
  onPress: () => void;
  primary?: boolean;
  light?: boolean;
}> = ({ label, onPress, primary = false, light = false }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, { width: "100%" }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { stiffness: 500, damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 500, damping: 20 }); }}
        activeOpacity={1}
        style={primary ? (light ? styles.primaryBtnLight : styles.primaryBtn) : styles.secondaryBtn}
      >
        {primary && !light ? (
          <LinearGradient
            colors={["#FFFFFF", "#F0EDFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnInner}
          >
            <Text style={styles.primaryBtnText}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.primaryBtnInner}>
            <Text style={light ? styles.primaryBtnTextLight : styles.secondaryBtnText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5FF" },
  scroll: { flexGrow: 1 },

  // Hero
  heroSection: {
    minHeight: height,
    position: "relative",
    overflow: "hidden",
  },
  heroInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  orbTop: {
    position: "absolute", top: -120, left: -80,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  orbBottom: {
    position: "absolute", bottom: -100, right: -60,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bubble: {
    position: "absolute", borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  bubbleText: { color: "#fff", fontWeight: "700" },
  logoWrapper: { alignItems: "center", justifyContent: "center" },
  logoGlass: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
  },
  logoGlow: {
    position: "absolute", width: 120, height: 120,
    borderRadius: 34, backgroundColor: "rgba(255,255,255,0.08)", zIndex: -1,
  },
  logoEmoji: { fontSize: 50 },
  badge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 99,
  },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  titleBlock: { alignItems: "center", gap: 10 },
  appName: {
    fontSize: 44, fontWeight: "900", color: "#FFFFFF",
    letterSpacing: -1.5, textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 17, color: "rgba(255,255,255,0.85)",
    textAlign: "center", lineHeight: 25, fontWeight: "500",
  },
  pillsRow: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 8, justifyContent: "center",
  },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.28)", borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  pillIcon: { fontSize: 14 },
  pillText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  cta: { gap: 12, width: "100%" },
  primaryBtn: {
    borderRadius: BORDER_RADIUS.xl, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 14, elevation: 8,
  },
  primaryBtnLight: {
    borderRadius: BORDER_RADIUS.xl, overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  primaryBtnInner: { paddingVertical: 17, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: COLORS.primary, fontWeight: "800", fontSize: 17, letterSpacing: 0.3 },
  primaryBtnTextLight: { color: COLORS.primary, fontWeight: "800", fontSize: 17 },
  secondaryBtn: {
    paddingVertical: 16, borderRadius: BORDER_RADIUS.xl, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)",
  },
  secondaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 48, backgroundColor: "#F4F5FF" },
  sectionAlt: { backgroundColor: "#FFFFFF" },
  sectionTag: {
    alignSelf: "flex-start",
    backgroundColor: "#EDE9FF", paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 99, marginBottom: 12,
  },
  sectionTagText: { color: COLORS.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  sectionTitle: {
    fontSize: 26, fontWeight: "900", color: "#111827",
    letterSpacing: -0.8, lineHeight: 32, marginBottom: 10,
  },
  sectionSub: { fontSize: 15, color: "#6B7280", lineHeight: 23, marginBottom: 28 },

  // Features
  featuresGrid: { gap: 14 },
  featureCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: "#EDE9FF",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  featureIcon: { fontSize: 28, marginBottom: 10 },
  featureTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 6 },
  featureDesc: { fontSize: 14, color: "#6B7280", lineHeight: 21 },

  // Steps
  stepsList: { gap: 20 },
  stepRow: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  stepNum: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    flexShrink: 0,
  },
  stepNumText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  stepContent: { flex: 1, paddingTop: 4 },
  stepTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 4 },
  stepDesc: { fontSize: 14, color: "#6B7280", lineHeight: 21 },

  // Pricing
  pricingRow: { flexDirection: "row", gap: 14 },
  pricingCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: "#E2E8F0",
  },
  pricingCardPremium: {
    flex: 1, borderRadius: 20, padding: 20, position: "relative", overflow: "visible",
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  pricingBadge: {
    position: "absolute", top: -12, alignSelf: "center",
    backgroundColor: "#FFD700", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 99,
  },
  pricingBadgeText: { color: "#111", fontSize: 10, fontWeight: "900" },
  pricingLabel: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 6 },
  pricingLabelPremium: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.75)", marginBottom: 6, marginTop: 8 },
  pricingPrice: { fontSize: 32, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  pricingPricePremium: { fontSize: 32, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  pricingPer: { fontSize: 12, color: "#9CA3AF", marginBottom: 16, fontWeight: "600" },
  pricingPerPremium: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 16, fontWeight: "600" },
  pricingFeatures: { gap: 8 },
  pricingFeatureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkIcon: { color: COLORS.primary, fontWeight: "900", fontSize: 13 },
  pricingFeatureText: { fontSize: 13, color: "#374151", fontWeight: "500" },

  // Bottom CTA
  bottomCta: {
    paddingHorizontal: 24, paddingVertical: 56,
    alignItems: "center", gap: 16,
  },
  bottomCtaTitle: {
    fontSize: 28, fontWeight: "900", color: "#fff",
    letterSpacing: -0.8, textAlign: "center",
  },
  bottomCtaSub: {
    fontSize: 15, color: "rgba(255,255,255,0.82)",
    textAlign: "center", lineHeight: 23, marginBottom: 8,
  },
  loginLink: { paddingVertical: 8 },
  loginLinkText: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "600" },

  // Footer
  footer: {
    backgroundColor: "#111827", paddingVertical: 32, paddingHorizontal: 24,
    alignItems: "center", gap: 8,
  },
  footerLogo: { fontSize: 18, fontWeight: "900", color: "#fff", marginBottom: 4 },
  footerText: { fontSize: 13, color: "#6B7280", textAlign: "center" },
});
