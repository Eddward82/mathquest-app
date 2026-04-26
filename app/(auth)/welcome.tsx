import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
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
  interpolate,
} from "react-native-reanimated";
import { COLORS, BORDER_RADIUS, SHADOWS } from "../../src/constants/theme";
import { useAuthStore } from "../../src/store/authStore";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { continueAsGuest } = useAuthStore();

  // ── Entrance animations ───────────────────────────────────────────────────
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(40);
  const titleOpacity = useSharedValue(0);
  const pillsTranslate = useSharedValue(30);
  const pillsOpacity = useSharedValue(0);
  const ctaTranslate = useSharedValue(40);
  const ctaOpacity = useSharedValue(0);

  // ── Floating bubble animations ────────────────────────────────────────────
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const float4 = useSharedValue(0);
  const float5 = useSharedValue(0);

  // ── Logo pulse ────────────────────────────────────────────────────────────
  const logoPulse = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance
    logoScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 120 }));
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    titleTranslate.value = withDelay(300, withSpring(0, { damping: 16, stiffness: 150 }));
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    pillsTranslate.value = withDelay(500, withSpring(0, { damping: 16, stiffness: 150 }));
    pillsOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    ctaTranslate.value = withDelay(700, withSpring(0, { damping: 16, stiffness: 150 }));
    ctaOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));

    // Continuous floating bubbles (different speeds/directions)
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
    float4.value = withRepeat(
      withSequence(withTiming(12, { duration: 2400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })),
      -1, true
    );
    float5.value = withRepeat(
      withSequence(withTiming(-16, { duration: 3800, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 3800, easing: Easing.inOut(Easing.sin) })),
      -1, true
    );

    // Logo gentle pulse
    logoPulse.value = withDelay(1200, withRepeat(
      withSequence(withSpring(1.06, { stiffness: 60 }), withSpring(1, { stiffness: 60 })),
      -1, true
    ));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * logoPulse.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));
  const pillsStyle = useAnimatedStyle(() => ({
    opacity: pillsOpacity.value,
    transform: [{ translateY: pillsTranslate.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslate.value }],
  }));

  const bubble1Style = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }] }));
  const bubble2Style = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }] }));
  const bubble3Style = useAnimatedStyle(() => ({ transform: [{ translateY: float3.value }] }));
  const bubble4Style = useAnimatedStyle(() => ({ transform: [{ translateY: float4.value }] }));
  const bubble5Style = useAnimatedStyle(() => ({ transform: [{ translateY: float5.value }] }));

  const handleGuest = () => {
    continueAsGuest();
    router.replace("/onboarding");
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#4C35DE", "#6C63FF", "#9B8FF5"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Background orbs */}
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      {/* Floating math symbols */}
      <Animated.View style={[styles.bubble, { top: height * 0.08, left: 28, width: 70, height: 70, opacity: 0.28 }, bubble1Style]}>
        <Text style={[styles.bubbleText, { fontSize: 30 }]}>∑</Text>
      </Animated.View>
      <Animated.View style={[styles.bubble, { top: height * 0.14, right: 36, width: 54, height: 54, opacity: 0.22 }, bubble2Style]}>
        <Text style={[styles.bubbleText, { fontSize: 24 }]}>π</Text>
      </Animated.View>
      <Animated.View style={[styles.bubble, { top: height * 0.22, left: 70, width: 44, height: 44, opacity: 0.18 }, bubble3Style]}>
        <Text style={[styles.bubbleText, { fontSize: 19 }]}>√</Text>
      </Animated.View>
      <Animated.View style={[styles.bubble, { top: height * 0.72, right: 24, width: 60, height: 60, opacity: 0.2 }, bubble4Style]}>
        <Text style={[styles.bubbleText, { fontSize: 26 }]}>∞</Text>
      </Animated.View>
      <Animated.View style={[styles.bubble, { top: height * 0.78, left: 20, width: 48, height: 48, opacity: 0.2 }, bubble5Style]}>
        <Text style={[styles.bubbleText, { fontSize: 21 }]}>Δ</Text>
      </Animated.View>

      <SafeAreaView style={styles.safe}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.logoWrapper, logoStyle]}>
            <LinearGradient
              colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.15)"]}
              style={styles.logoGlass}
            >
              <Text style={styles.logoEmoji}>🧮</Text>
            </LinearGradient>
            {/* Glow ring */}
            <View style={styles.logoGlow} />
          </Animated.View>

          <Animated.View style={[styles.titleBlock, titleStyle]}>
            <Text style={styles.appName}>MathQuest</Text>
            <Text style={styles.tagline}>
              Level up your maths skills.{"\n"}One lesson at a time.
            </Text>
          </Animated.View>
        </View>

        {/* Feature pills */}
        <Animated.View style={[styles.pillsRow, pillsStyle]}>
          {[
            { icon: "🔥", label: "Daily streaks" },
            { icon: "⚡", label: "Earn XP" },
            { icon: "🤖", label: "AI tutor" },
            { icon: "🏆", label: "Achievements" },
          ].map((f) => (
            <View key={f.label} style={styles.pill}>
              <Text style={styles.pillIcon}>{f.icon}</Text>
              <Text style={styles.pillText}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.cta, ctaStyle]}>
          <PressableButton
            label="Get Started →"
            onPress={() => router.push("/(auth)/signup")}
            primary
          />
          <PressableButton
            label="I already have an account"
            onPress={() => router.push("/(auth)/login")}
          />
          <TouchableOpacity onPress={handleGuest} style={styles.guestBtn}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ── Pressable button with spring scale microinteraction ──────────────────────

const PressableButton: React.FC<{
  label: string;
  onPress: () => void;
  primary?: boolean;
}> = ({ label, onPress, primary = false }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { stiffness: 500, damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 500, damping: 20 }); }}
        activeOpacity={1}
        style={primary ? styles.primaryBtn : styles.secondaryBtn}
      >
        {primary ? (
          <LinearGradient
            colors={["#FFFFFF", "#F0EDFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnInner}
          >
            <Text style={styles.primaryBtnText}>{label}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.secondaryBtnText}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    justifyContent: "space-between",
  },
  orbTop: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -100,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bubble: {
    position: "absolute",
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleText: { color: "#fff", fontWeight: "700" },
  heroSection: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  logoWrapper: { alignItems: "center", justifyContent: "center" },
  logoGlass: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  logoGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.08)",
    zIndex: -1,
  },
  logoEmoji: { fontSize: 56 },
  titleBlock: { alignItems: "center", gap: 10 },
  appName: {
    fontSize: 46,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1.5,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 17,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    lineHeight: 25,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
  },
  pillIcon: { fontSize: 15 },
  pillText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  cta: { gap: 12 },
  primaryBtn: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnInner: {
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  secondaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  guestBtn: { alignItems: "center", paddingVertical: 10 },
  guestText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
    textDecorationColor: "rgba(255,255,255,0.4)",
  },
});
