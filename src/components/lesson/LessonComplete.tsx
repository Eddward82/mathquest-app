import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  withRepeat,
  FadeInDown,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";
import { Button } from "../ui/Button";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ── Confetti particle ─────────────────────────────────────────────────────────
const COLORS_CONF = ["#6C63FF", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#F97316", "#3B82F6", "#EC4899"];
const PARTICLE_COUNT = 28;

interface ParticleConfig {
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
}

const Particle: React.FC<{ cfg: ParticleConfig }> = ({ cfg }) => {
  const y = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(cfg.delay, withTiming(1, { duration: 120 }));
    y.value = withDelay(cfg.delay, withTiming(SCREEN_H * 0.85, { duration: cfg.duration, easing: Easing.out(Easing.quad) }));
    rotate.value = withDelay(cfg.delay, withTiming(cfg.rotate, { duration: cfg.duration }));
    // Fade out in last 30%
    opacity.value = withDelay(
      cfg.delay + cfg.duration * 0.7,
      withTiming(0, { duration: cfg.duration * 0.3 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left: cfg.x,
    top: y.value,
    opacity: opacity.value,
    transform: [{ rotate: `${rotate.value}deg` }],
    width: cfg.size,
    height: cfg.size * 0.45,
    borderRadius: 2,
    backgroundColor: cfg.color,
  }));

  return <Animated.View style={style} />;
};

const Confetti: React.FC = () => {
  const particles = useMemo<ParticleConfig[]>(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: Math.random() * SCREEN_W,
      color: COLORS_CONF[i % COLORS_CONF.length],
      size: 8 + Math.random() * 8,
      delay: Math.random() * 400,
      duration: 1400 + Math.random() * 800,
      rotate: -180 + Math.random() * 360,
    })), []
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((cfg, i) => <Particle key={i} cfg={cfg} />)}
    </View>
  );
};

interface LessonCompleteProps {
  xpEarned: number;
  correctAnswers: number;
  totalQuestions: number;
  mistakes: number;
  onContinue: () => void;
}

export const LessonComplete: React.FC<LessonCompleteProps> = ({
  xpEarned,
  correctAnswers,
  totalQuestions,
  mistakes,
  onContinue,
}) => {
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(-8);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const xpScale = useSharedValue(0.6);
  const xpOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const shimmerX = useSharedValue(-140);

  const accuracy =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 100;

  const emoji = accuracy === 100 ? "🏆" : accuracy >= 80 ? "⭐" : accuracy >= 60 ? "👍" : "💪";
  const message =
    accuracy === 100 ? "Perfect Score!" : accuracy >= 80 ? "Excellent work!" : accuracy >= 60 ? "Good job!" : "Keep practising!";

  const gradientColors: [string, string, string] =
    accuracy === 100
      ? ["#F59E0B", "#EF4444", COLORS.primary]
      : accuracy >= 80
      ? [COLORS.primary, "#8B5CF6", "#6366F1"]
      : ["#3B82F6", "#6366F1", COLORS.primary];

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    trophyScale.value = withDelay(100, withSpring(1, { stiffness: 220, damping: 12 }));
    trophyRotate.value = withDelay(100, withSpring(0, { stiffness: 200, damping: 14 }));

    titleOpacity.value = withDelay(350, withTiming(1, { duration: 380 }));
    titleY.value = withDelay(350, withSpring(0, { stiffness: 300, damping: 20 }));

    xpOpacity.value = withDelay(550, withTiming(1, { duration: 300 }));
    xpScale.value = withDelay(550, withSequence(
      withSpring(1.12, { stiffness: 500, damping: 12 }),
      withSpring(1, { stiffness: 400, damping: 14 })
    ));

    // Ongoing pulse on trophy ring
    pulseScale.value = withDelay(800, withRepeat(
      withSequence(
        withSpring(1.06, { stiffness: 200, damping: 10 }),
        withSpring(1, { stiffness: 200, damping: 10 })
      ),
      -1,
      true
    ));

    // Shimmer sweep on XP badge
    shimmerX.value = withDelay(700, withRepeat(
      withSequence(
        withTiming(-140, { duration: 0 }),
        withTiming(340, { duration: 1400 })
      ),
      -1,
      false
    ));
  }, []);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotate.value}deg` },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ scale: xpScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Confetti for good scores */}
      {accuracy >= 80 && <Confetti />}

      {/* Trophy area */}
      <View style={styles.heroArea}>
        {/* Outer pulse ring */}
        <Animated.View style={[styles.pulseRing, pulseStyle]} />

        {/* Trophy circle */}
        <Animated.View style={trophyStyle}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trophyCircle}
          >
            {/* Inner orb decoration */}
            <View style={styles.trophyOrb} />
            <Text style={styles.trophyEmoji}>{emoji}</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Title + message */}
      <Animated.View style={[styles.textArea, titleStyle]}>
        <Text style={styles.completeTitle}>Lesson Complete!</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>

      {/* XP Badge */}
      <Animated.View style={xpStyle}>
        <View style={styles.xpBadge}>
          {/* Shimmer */}
          <Animated.View style={[styles.xpShimmer, shimmerStyle]} />
          <Text style={styles.xpEmoji}>⚡</Text>
          <Text style={styles.xpText}>+{xpEarned} XP earned!</Text>
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View
        entering={FadeInDown.delay(700).springify()}
        style={styles.statsRow}
      >
        <StatCard
          emoji="✅"
          color="#16A34A"
          bg="#F0FDF4"
          border="#86EFAC"
          label="Correct"
          value={`${correctAnswers}`}
        />
        <StatCard
          emoji="🎯"
          color={COLORS.primary}
          bg="#EDE9FF"
          border="#C4B5FD"
          label="Accuracy"
          value={`${accuracy}%`}
        />
        <StatCard
          emoji="❌"
          color="#DC2626"
          bg="#FFF1F2"
          border="#FCA5A5"
          label="Mistakes"
          value={`${mistakes}`}
        />
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInDown.delay(900).springify()}>
        <Button
          title="Continue →"
          onPress={onContinue}
          variant="primary"
          fullWidth
          size="lg"
        />
      </Animated.View>
    </View>
  );
};

interface StatCardProps {
  emoji: string;
  color: string;
  bg: string;
  border: string;
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ emoji, color, bg, border, label, value }) => (
  <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 22,
    paddingBottom: 8,
  },

  // Trophy hero
  heroArea: {
    alignItems: "center",
    justifyContent: "center",
    height: 160,
  },
  pulseRing: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 3,
    borderColor: `${COLORS.primary}30`,
    backgroundColor: `${COLORS.primary}08`,
  },
  trophyCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 14,
  },
  trophyOrb: {
    position: "absolute",
    top: -16,
    right: -16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  trophyEmoji: {
    fontSize: 60,
  },

  // Text
  textArea: {
    alignItems: "center",
    gap: 6,
  },
  completeTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.8,
  },
  message: {
    fontSize: 17,
    color: "#6B7280",
    fontWeight: "600",
  },

  // XP badge
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    backgroundColor: "#FEFCE8",
    borderWidth: 2,
    borderColor: "#FDE68A",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  xpShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ skewX: "-20deg" }],
  },
  xpEmoji: { fontSize: 20 },
  xpText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#92400E",
    letterSpacing: -0.2,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statEmoji: { fontSize: 20 },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
