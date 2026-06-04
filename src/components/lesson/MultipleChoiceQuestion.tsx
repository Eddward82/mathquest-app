import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MultipleChoiceContent } from "../../types";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";
import { FeedbackBanner } from "../ui/FeedbackBanner";
import { Button } from "../ui/Button";
import { HintButton, HINT_XP_COST } from "./HintButton";

interface MultipleChoiceQuestionProps {
  content: MultipleChoiceContent;
  onCorrect: () => void;
  onMistake: () => void;
  onNext: () => void;
  onAIHelp: () => void;
  hintsUsed?: number;
  onUseHint?: (xpCost: number) => void;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  content,
  onCorrect,
  onMistake,
  onNext,
  onAIHelp,
  hintsUsed = 0,
  onUseHint,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [eliminatedIndex, setEliminatedIndex] = useState<number | null>(null);

  // Pick a wrong answer to eliminate for the hint
  const wrongIndexToEliminate = useMemo(() => {
    const wrongs = content.options
      .map((_, i) => i)
      .filter((i) => i !== content.correct_index);
    return wrongs[Math.floor(Math.random() * wrongs.length)];
  }, [content]);

  const hintText = `One wrong answer has been removed. There are now ${content.options.length - 2} wrong options left.`;

  const shakeOffset = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
    setIsAnswered(true);

    const isCorrect = index === content.correct_index;
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCorrect();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeOffset.value = withSequence(
        withSpring(-8, { stiffness: 600 }),
        withSpring(8, { stiffness: 600 }),
        withSpring(-5, { stiffness: 600 }),
        withSpring(5, { stiffness: 600 }),
        withSpring(0, { stiffness: 600 })
      );
      onMistake();
    }
  };

  const getOptionStyle = (index: number) => {
    if (!isAnswered) return { bg: COLORS.white, border: COLORS.border, text: COLORS.textPrimary };
    if (index === content.correct_index) return { bg: "#F0FDF4", border: COLORS.success, text: COLORS.successDark };
    if (index === selectedIndex) return { bg: "#FFF1F2", border: COLORS.danger, text: COLORS.dangerDark };
    return { bg: COLORS.white, border: COLORS.border, text: COLORS.textMuted };
  };

  return (
    <Animated.View style={[styles.container, shakeStyle]}>
      {/* Question */}
      <View style={styles.questionBox}>
        <Text style={styles.question}>{content.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.options}>
        {content.options.map((option, index) => {
          const s = getOptionStyle(index);
          const isCorrect = index === content.correct_index && isAnswered;
          const isWrong = index === selectedIndex && !isCorrect && isAnswered;
          const isEliminated = index === eliminatedIndex && !isAnswered;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                { backgroundColor: s.bg, borderColor: s.border },
                isEliminated && styles.optionEliminated,
              ]}
              onPress={() => handleSelect(index)}
              disabled={isAnswered || isEliminated}
              activeOpacity={0.7}
            >
              <View style={[styles.optionLetter, { backgroundColor: s.border }]}>
                <Text style={[styles.letterText, { color: s.text }]}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                { color: s.text },
                isEliminated && styles.optionTextEliminated,
              ]}>{option}</Text>
              {isCorrect && (
                <Feather name="check-circle" size={20} color={COLORS.success} />
              )}
              {isWrong && (
                <Feather name="x-circle" size={20} color={COLORS.danger} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feedback */}
      {isAnswered && (
        <FeedbackBanner
          isCorrect={selectedIndex === content.correct_index}
          explanation={content.explanation}
          visible={isAnswered}
        />
      )}

      {/* Actions */}
      {isAnswered ? (
        <View style={styles.actions}>
          <Button title="Continue" onPress={onNext} variant="primary" fullWidth size="lg" />
        </View>
      ) : (
        <HintButton
          hintsUsed={hintsUsed}
          hint={hintText}
          onUseHint={() => {
            setEliminatedIndex(wrongIndexToEliminate);
            onUseHint?.(HINT_XP_COST);
          }}
          onAIHelp={onAIHelp}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  questionBox: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  question: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontSize: 13,
    fontWeight: "800",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  actions: { marginTop: 8 },
  optionEliminated: { opacity: 0.35, backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" },
  optionTextEliminated: { textDecorationLine: "line-through", color: "#9CA3AF" },
});
