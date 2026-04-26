import React, { useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";
import { FREE_DAILY_LIMIT } from "../../store/subscriptionStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const HIGHLIGHTS = [
  "Unlimited lessons every day",
  "Double XP on every answer",
  "Unlimited AI tutor help",
];

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const sheetY = useSharedValue(SCREEN_HEIGHT);
  const crownScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      sheetY.value = withSpring(0, { stiffness: 280, damping: 28 });
      crownScale.value = withRepeat(
        withSequence(
          withSpring(1.15, { stiffness: 200, damping: 10 }),
          withSpring(1, { stiffness: 200, damping: 10 })
        ),
        -1,
        true
      );
    } else {
      sheetY.value = withTiming(SCREEN_HEIGHT, { duration: 280 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));

  const handleGoToPremium = () => {
    onClose();
    router.push("/paywall");
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Header gradient */}
          <LinearGradient
            colors={["#4F46E5", COLORS.primary, "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerOrb} />

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>

            <Animated.View style={[styles.crownCircle, crownStyle]}>
              <Text style={styles.crownEmoji}>👑</Text>
            </Animated.View>

            <Text style={styles.headerTitle}>Daily limit reached</Text>
            <Text style={styles.headerSub}>
              Free users get {FREE_DAILY_LIMIT} lessons per day.{"\n"}
              Upgrade to keep learning without limits!
            </Text>
          </LinearGradient>

          {/* Perks */}
          <Animated.View entering={FadeIn.delay(120)} style={styles.body}>
            {HIGHLIGHTS.map((item, i) => (
              <View key={i} style={styles.perkRow}>
                <View style={styles.perkDot}>
                  <Feather name="check" size={12} color={COLORS.primary} />
                </View>
                <Text style={styles.perkText}>{item}</Text>
              </View>
            ))}
          </Animated.View>

          {/* CTAs */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleGoToPremium}
              activeOpacity={0.88}
              style={styles.upgradeBtn}
            >
              <LinearGradient
                colors={["#4F46E5", COLORS.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeBtnGradient}
              >
                <Feather name="zap" size={16} color="#FFFFFF" />
                <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.laterBtn}>
              <Text style={styles.laterText}>Come back tomorrow</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 20,
  },

  // Header
  header: {
    alignItems: "center",
    padding: 28,
    paddingTop: 24,
    gap: 10,
    overflow: "hidden",
  },
  headerOrb: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 4,
  },
  crownEmoji: { fontSize: 36 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    lineHeight: 21,
    fontWeight: "500",
  },

  // Body
  body: { paddingHorizontal: 24, paddingVertical: 20, gap: 12 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  perkDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  perkText: { fontSize: 14, fontWeight: "600", color: "#1F2937" },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 36, gap: 12 },
  upgradeBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  upgradeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  upgradeBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  laterBtn: { alignItems: "center", paddingVertical: 8 },
  laterText: { fontSize: 14, color: "#9CA3AF", fontWeight: "600" },
});
