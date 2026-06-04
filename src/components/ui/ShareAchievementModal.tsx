import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Platform, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { Achievement } from "../../types";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ShareAchievementModalProps {
  visible: boolean;
  achievement: Achievement | null;
  username: string;
  onClose: () => void;
}

export const ShareAchievementModal: React.FC<ShareAchievementModalProps> = ({
  visible,
  achievement,
  username,
  onClose,
}) => {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  if (!achievement) return null;

  const handleShare = async () => {
    try {
      setSharing(true);
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `I earned the "${achievement.title}" badge on MathQuest!`,
        });
      }
    } catch {
      // Silently ignore sharing errors
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="x" size={20} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.sheetTitle}>Achievement Unlocked! 🎉</Text>
          <Text style={styles.sheetSub}>Share your achievement with friends</Text>

          {/* Shareable card — this gets captured as an image */}
          <View ref={cardRef} collapsable={false} style={styles.cardWrapper}>
            <LinearGradient
              colors={["#4C35DE", "#6C63FF", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Decorative orbs */}
              <View style={styles.orb1} />
              <View style={styles.orb2} />

              {/* App name */}
              <View style={styles.appRow}>
                <Text style={styles.appIcon}>🧮</Text>
                <Text style={styles.appName}>MathQuest</Text>
              </View>

              {/* Badge */}
              <View style={styles.badgeCircle}>
                <Feather name={achievement.icon as any} size={40} color="#FFFFFF" />
              </View>

              {/* Achievement info */}
              <Text style={styles.cardTitle}>{achievement.title}</Text>
              <Text style={styles.cardDesc}>{achievement.description}</Text>

              {/* XP */}
              <View style={styles.xpRow}>
                <Text style={styles.xpEmoji}>⚡</Text>
                <Text style={styles.xpText}>+{achievement.xp_reward} XP earned</Text>
              </View>

              {/* Username */}
              <View style={styles.userRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{(username[0] ?? "U").toUpperCase()}</Text>
                </View>
                <Text style={styles.userName}>{username}</Text>
              </View>

              {/* Footer */}
              <Text style={styles.cardFooter}>mathquest.app · Learn maths every day</Text>
            </LinearGradient>
          </View>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onClose} style={styles.skipBtn} activeOpacity={0.8}>
              <Text style={styles.skipBtnText}>Not now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing}
              activeOpacity={0.9}
              style={styles.shareWrap}
            >
              <LinearGradient
                colors={[COLORS.primary, "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareBtn}
              >
                {sharing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="share-2" size={16} color="#FFFFFF" />
                    <Text style={styles.shareBtnText}>Share</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#F4F5FF",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 16, alignItems: "center",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 20,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  sheetTitle: { fontSize: 20, fontWeight: "900", color: "#111827", textAlign: "center" },
  sheetSub: { fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: -8 },

  // Card
  cardWrapper: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  card: {
    padding: 28, alignItems: "center", gap: 10, overflow: "hidden",
  },
  orb1: {
    position: "absolute", top: -40, left: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  orb2: {
    position: "absolute", bottom: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  appRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  appIcon: { fontSize: 16 },
  appName: { fontSize: 14, fontWeight: "800", color: "rgba(255,255,255,0.8)", letterSpacing: 0.5 },

  badgeCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
    marginVertical: 4,
  },

  cardTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5, textAlign: "center" },
  cardDesc: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 20, fontWeight: "500" },

  xpRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  xpEmoji: { fontSize: 14 },
  xpText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },

  userRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4,
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  avatarLetter: { fontSize: 13, fontWeight: "900", color: "#FFFFFF" },
  userName: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.85)" },

  cardFooter: {
    fontSize: 10, color: "rgba(255,255,255,0.45)",
    fontWeight: "500", marginTop: 4, letterSpacing: 0.3,
  },

  // Buttons
  btnRow: { flexDirection: "row", gap: 12, width: "100%" },
  skipBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#E2E8F0", borderRadius: 16,
    paddingVertical: 14,
  },
  skipBtnText: { fontSize: 15, fontWeight: "700", color: "#6B7280" },
  shareWrap: {
    flex: 2, borderRadius: 16, overflow: "hidden",
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
  },
  shareBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});
