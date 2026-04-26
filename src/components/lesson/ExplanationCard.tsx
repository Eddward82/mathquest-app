import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { ExplanationContent } from "../../types";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";

interface ExplanationCardProps {
  content: ExplanationContent;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({ content }) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
      {/* Title section */}
      <LinearGradient
        colors={[COLORS.primary, "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.titleCard}
      >
        <Feather name="book-open" size={28} color={COLORS.white} />
        <Text style={styles.title}>{content.title}</Text>
      </LinearGradient>

      {/* Body */}
      <View style={styles.bodyCard}>
        <Text style={styles.body}>{formatBody(content.body)}</Text>
      </View>

      {/* Example */}
      {content.example && (
        <View style={styles.exampleCard}>
          <View style={styles.exampleHeader}>
            <Feather name="edit-3" size={16} color={COLORS.secondary} />
            <Text style={styles.exampleLabel}>Example</Text>
          </View>
          <Text style={styles.exampleText}>{content.example}</Text>
        </View>
      )}

      {/* Tip */}
      {content.tip && (
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Feather name="zap" size={16} color={COLORS.gold} />
            <Text style={styles.tipLabel}>Pro Tip</Text>
          </View>
          <Text style={styles.tipText}>{content.tip}</Text>
        </View>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
};

// Simple markdown-like bold parser: **text** → bold Text
function formatBody(text: string): string {
  // Return plain text — in a real app, use a markdown renderer
  return text.replace(/\*\*/g, "");
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  titleCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  bodyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  body: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
    fontWeight: "400",
  },
  exampleCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  exampleLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exampleText: {
    fontSize: 15,
    color: "#92400E",
    lineHeight: 24,
    fontFamily: "monospace",
  },
  tipCard: {
    backgroundColor: "#FEFCE8",
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 14,
    color: "#713F12",
    lineHeight: 22,
  },
  spacer: {
    height: 20,
  },
});
