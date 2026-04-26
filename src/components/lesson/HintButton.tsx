import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";

export const HINT_XP_COST = 5;
export const MAX_HINTS = 3;

interface HintButtonProps {
  hintsUsed: number;
  hint: string;
  onUseHint: () => void; // caller deducts XP and increments hintsUsed
  onAIHelp: () => void;
  disabled?: boolean;
}

export const HintButton: React.FC<HintButtonProps> = ({
  hintsUsed,
  hint,
  onUseHint,
  onAIHelp,
  disabled = false,
}) => {
  const [showHint, setShowHint] = useState(false);
  const hintsLeft = MAX_HINTS - hintsUsed;
  const canUseHint = hintsLeft > 0 && !disabled;

  const handleHint = () => {
    if (!canUseHint) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowHint(true);
    onUseHint();
  };

  return (
    <View style={styles.wrap}>
      {/* Hint reveal card */}
      {showHint && (
        <Animated.View entering={FadeInDown.duration(280).springify()} style={styles.hintCard}>
          <View style={styles.hintHeader}>
            <Feather name="zap" size={14} color="#D97706" />
            <Text style={styles.hintHeaderText}>Hint</Text>
          </View>
          <Text style={styles.hintText}>{hint}</Text>
        </Animated.View>
      )}

      {/* Buttons row */}
      <View style={styles.btnRow}>
        {/* Hint button */}
        <TouchableOpacity
          onPress={handleHint}
          disabled={!canUseHint || showHint}
          style={[
            styles.hintBtn,
            (!canUseHint || showHint) && styles.hintBtnDisabled,
          ]}
          activeOpacity={0.75}
        >
          <Feather
            name="zap"
            size={14}
            color={canUseHint && !showHint ? "#D97706" : "#9CA3AF"}
          />
          <Text style={[styles.hintBtnText, (!canUseHint || showHint) && styles.hintBtnTextDisabled]}>
            {showHint
              ? "Hint used"
              : hintsLeft === 0
              ? "No hints left"
              : `Hint (−${HINT_XP_COST} XP)`}
          </Text>
          {!showHint && hintsLeft > 0 && (
            <View style={styles.hintCountBubble}>
              <Text style={styles.hintCountText}>{hintsLeft}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* AI explain button */}
        <TouchableOpacity onPress={onAIHelp} style={styles.aiBtn} activeOpacity={0.75}>
          <Feather name="cpu" size={14} color={COLORS.primary} />
          <Text style={styles.aiBtnText}>Explain</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 10 },

  hintCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    gap: 6,
  },
  hintHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  hintHeaderText: { fontSize: 12, fontWeight: "800", color: "#D97706", textTransform: "uppercase", letterSpacing: 0.5 },
  hintText: { fontSize: 14, fontWeight: "600", color: "#92400E", lineHeight: 20 },

  btnRow: { flexDirection: "row", gap: 10 },

  hintBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFBEB",
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  hintBtnDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  hintBtnText: { fontSize: 13, fontWeight: "700", color: "#D97706" },
  hintBtnTextDisabled: { color: "#9CA3AF" },
  hintCountBubble: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#D97706", alignItems: "center", justifyContent: "center",
  },
  hintCountText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },

  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "30",
  },
  aiBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
});
