import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { COLORS, BORDER_RADIUS } from "../../src/constants/theme";
import { AppLogo } from "../../src/components/ui/AppLogo";
import { useSubscriptionStore } from "../../src/store/subscriptionStore";

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

const HERO_CHIPS = [
  { icon: "🔥", title: "Streaks", sub: "Daily habit", subColor: "#FCD34D" },
  { icon: "⚡", title: "Earn XP", sub: "Fast rewards", subColor: "#FDE047" },
  { icon: "🤖", title: "AI Tutor", sub: "Step-by-step", subColor: "#67E8F9" },
  { icon: "🏆", title: "Badges", sub: "Collect them all", subColor: "#E9D5FF" },
];

// Faint maths symbols drifting in the hero background.
const GLYPHS = [
  { char: "∑", top: 0.08, left: 0.07, size: 36, opacity: 0.11, duration: 3000, delay: 0 },
  { char: "π", top: 0.13, right: 0.09, size: 36, opacity: 0.11, duration: 2250, delay: 1000 },
  { char: "√", top: 0.28, left: 0.1, size: 30, opacity: 0.09, duration: 2250, delay: 1000 },
  { char: "∞", top: 0.42, right: 0.08, size: 36, opacity: 0.1, duration: 3000, delay: 0 },
  { char: "×", top: 0.57, left: 0.06, size: 30, opacity: 0.08, duration: 3000, delay: 0 },
  { char: "÷", top: 0.67, right: 0.11, size: 30, opacity: 0.09, duration: 2250, delay: 1000 },
];

export default function WelcomeScreen() {
  const { plans, loadPlans } = useSubscriptionStore();
  const monthlyPlan = plans.find((p) => p.id === "monthly");
  const insets = useSafeAreaInsets();

  useEffect(() => { loadPlans(); }, []);

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const heroTranslate = useSharedValue(30);
  const badgePulse = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 120 }));
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    heroOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    heroTranslate.value = withDelay(300, withSpring(0, { damping: 16, stiffness: 150 }));
    badgePulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
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
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + badgePulse.value * 0.15,
    transform: [{ scale: 1 + badgePulse.value * 0.04 }],
  }));

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── HERO SECTION ─────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <HeroBackground />

          {GLYPHS.map((g) => (
            <FloatingGlyph key={g.char} {...g} />
          ))}

          <View
            style={[
              styles.heroInner,
              { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 },
            ]}
          >
            {/* Top: status pill */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Animated.View style={[styles.badge, badgeStyle]}>
                <Text style={styles.badgeEmoji}>🎉</Text>
                <Text style={styles.badgeText}>Free to download</Text>
              </Animated.View>
            </Animated.View>

            {/* Middle: identity */}
            <View style={styles.heroCenter}>
              <Animated.View style={[styles.logoWrapper, logoStyle]}>
                <Svg width={200} height={200} style={styles.logoHalo} pointerEvents="none">
                  <Defs>
                    <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
                      <Stop offset="0" stopColor="#A78BFA" stopOpacity="0.75" />
                      <Stop offset="0.55" stopColor="#8B5CF6" stopOpacity="0.3" />
                      <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={100} cy={100} r={100} fill="url(#halo)" />
                </Svg>
                <View style={styles.logoShadow}>
                  <AppLogo size={128} />
                </View>
              </Animated.View>

              <Animated.View style={[styles.titleBlock, heroStyle]}>
                <Text style={styles.appName}>MathQuest</Text>
                <Text style={styles.tagline}>
                  Learn Maths. Earn XP.{"\n"}
                  <Text style={styles.taglineStrong}>Level Up Every Day.</Text>
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.chipGrid}>
                {HERO_CHIPS.map((c) => (
                  <View key={c.title} style={styles.chip}>
                    <Text style={styles.chipIcon}>{c.icon}</Text>
                    <View style={styles.chipTextCol}>
                      <Text style={styles.chipTitle} numberOfLines={1}>{c.title}</Text>
                      <Text style={[styles.chipSub, { color: c.subColor }]} numberOfLines={1}>{c.sub}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
            </View>

            {/* Bottom: actions */}
            <Animated.View entering={FadeInDown.delay(550).springify()} style={styles.cta}>
              <PressableButton
                label="Get Started Free"
                onPress={() => router.push("/(auth)/signup")}
                primary
                arrow
              />
              <PressableButton
                label="I already have an account"
                onPress={() => router.push("/(auth)/login")}
              />
              <Text style={styles.trustNote}>No credit card required • Instant access</Text>
            </Animated.View>
          </View>
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
          <Text style={styles.sectionSub}>Start free. Upgrade when you&apos;re ready.</Text>

          <View style={styles.pricingRow}>
            {/* Free card */}
            <View style={styles.pricingCard}>
              <Text style={styles.pricingLabel}>Free</Text>
              <Text style={styles.pricingPrice}>$0</Text>
              <Text style={styles.pricingPer}>forever</Text>
              <View style={styles.pricingFeatures}>
                {["5 lessons (lifetime)", "Basic progress tracking", "XP & streaks"].map((f) => (
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
              <Text style={styles.pricingPricePremium}>{monthlyPlan?.price ?? "..."}</Text>
              <Text style={styles.pricingPerPremium}>/month</Text>
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
          <View style={styles.footerBrand}>
            <AppLogo size={24} />
            <Text style={styles.footerLogo}>MathQuest</Text>
          </View>
          <Text style={styles.footerText}>
            &copy; 2026 MathQuest. All rights reserved.
          </Text>
          <Text style={styles.footerText}>
            support@smartbloomai.org
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── HeroBackground ────────────────────────────────────────────────────────────
// Radial purple base plus soft glow orbs (SVG gradients stand in for CSS blur).
const HeroBackground: React.FC = () => (
  <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
    <Defs>
      <RadialGradient id="bg" cx="50%" cy="18%" rx="110%" ry="90%" fx="50%" fy="18%">
        <Stop offset="0" stopColor="#7852FF" />
        <Stop offset="0.45" stopColor="#4D33CA" />
        <Stop offset="1" stopColor="#2A176E" />
      </RadialGradient>
      <RadialGradient id="orbViolet" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#A78BFA" stopOpacity="0.35" />
        <Stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="orbFuchsia" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#D946EF" stopOpacity="0.22" />
        <Stop offset="1" stopColor="#D946EF" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="orbIndigo" cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#6366F1" stopOpacity="0.3" />
        <Stop offset="1" stopColor="#6366F1" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg)" />
    <Circle cx={width / 2} cy={40} r={200} fill="url(#orbViolet)" />
    <Circle cx={width + 10} cy={height * 0.45} r={160} fill="url(#orbFuchsia)" />
    <Circle cx={20} cy={height - 100} r={170} fill="url(#orbIndigo)" />
  </Svg>
);

// ── FloatingGlyph ─────────────────────────────────────────────────────────────
const FloatingGlyph: React.FC<{
  char: string;
  top: number;
  left?: number;
  right?: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}> = ({ char, top, left, right, size, opacity, duration, delay }) => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * t.value }, { rotate: `${3 * t.value}deg` }],
  }));

  const horizontal = left !== undefined ? { left: width * left } : { right: width * (right ?? 0) };

  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.glyph,
        { top: height * top, fontSize: size, color: `rgba(255,255,255,${opacity})` },
        horizontal,
        animStyle,
      ]}
    >
      {char}
    </Animated.Text>
  );
};

// ── PressableButton ───────────────────────────────────────────────────────────
const PressableButton: React.FC<{
  label: string;
  onPress: () => void;
  primary?: boolean;
  light?: boolean;
  arrow?: boolean;
}> = ({ label, onPress, primary = false, light = false, arrow = false }) => {
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
          <View style={styles.primaryBtnInner}>
            <Text style={styles.primaryBtnText}>{label}</Text>
            {arrow && <Text style={styles.primaryBtnArrow}>→</Text>}
          </View>
        ) : (
          <View style={light ? styles.primaryBtnInner : styles.secondaryBtnInner}>
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
    backgroundColor: "#4D33CA",
  },
  heroInner: {
    flex: 1,
    minHeight: height,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCenter: {
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
  },
  glyph: {
    position: "absolute",
    fontWeight: "900",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 99,
  },
  badgeEmoji: { fontSize: 14 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 200,
    marginTop: -20,
    marginBottom: -16,
  },
  logoHalo: { position: "absolute", top: 0, left: 0 },
  logoShadow: {
    borderRadius: 34,
    shadowColor: "#1C0850",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 18,
  },
  titleBlock: { alignItems: "center" },
  appName: {
    fontSize: 42, fontWeight: "800", color: "#FFFFFF",
    letterSpacing: -1, textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16, color: "rgba(255,255,255,0.9)",
    textAlign: "center", lineHeight: 22, fontWeight: "500",
  },
  taglineStrong: { color: "#FFFFFF", fontWeight: "700" },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    width: "100%",
    maxWidth: 310,
    marginTop: 24,
  },
  chip: {
    width: "48.4%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  chipIcon: { fontSize: 20 },
  chipTextCol: { flex: 1 },
  chipTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },
  chipSub: { fontSize: 10, fontWeight: "600", marginTop: 1 },
  cta: { gap: 12, width: "100%" },
  primaryBtn: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(200,205,225,0.9)",
    shadowColor: "#18073C", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  primaryBtnLight: {
    borderRadius: BORDER_RADIUS.xl, overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  primaryBtnInner: {
    flexDirection: "row", gap: 8,
    paddingVertical: 16, alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { color: "#39218F", fontWeight: "800", fontSize: 17 },
  primaryBtnArrow: { color: "#39218F", fontWeight: "700", fontSize: 20 },
  primaryBtnTextLight: { color: COLORS.primary, fontWeight: "800", fontSize: 17 },
  secondaryBtn: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.24)",
  },
  secondaryBtnInner: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { color: "#FFFFFF", fontWeight: "500", fontSize: 15 },
  trustNote: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
    color: "rgba(255,255,255,0.6)",
    marginTop: -2,
  },

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
  footerBrand: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  footerLogo: { fontSize: 18, fontWeight: "900", color: "#fff" },
  footerText: { fontSize: 13, color: "#6B7280", textAlign: "center" },
});
