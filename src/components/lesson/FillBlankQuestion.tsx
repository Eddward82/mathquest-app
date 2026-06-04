import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { FillBlankContent } from "../../types";
import { COLORS, BORDER_RADIUS } from "../../constants/theme";
import { FeedbackBanner } from "../ui/FeedbackBanner";
import { Button } from "../ui/Button";
import { HintButton, HINT_XP_COST } from "./HintButton";

interface FillBlankQuestionProps {
  content: FillBlankContent;
  onCorrect: () => void;
  onMistake: () => void;
  onNext: () => void;
  onAIHelp: () => void;
  hintsUsed?: number;
  onUseHint?: (xpCost: number) => void;
}

export const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({
  content,
  onCorrect,
  onMistake,
  onNext,
  onAIHelp,
  hintsUsed = 0,
  onUseHint,
}) => {
  const [answer, setAnswer] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Hint: reveal first N characters depending on hintsUsed
  const hintText = (() => {
    const ans = content.correct_answer;
    if (ans.length <= 1) return `The answer starts with "${ans[0]}".`;
    const reveal = Math.min(hintsUsed + 1, Math.ceil(ans.length / 2));
    return `The answer starts with "${ans.slice(0, reveal)}…" (${ans.length} characters total)`;
  })();

  const insertSymbol = (symbol: string) => {
    setAnswer((prev) => prev + symbol);
    inputRef.current?.focus();
  };
  const shakeOffset = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const handleSubmit = () => {
    if (!answer.trim() || isAnswered) return;
    Keyboard.dismiss();

    const normalised = answer.trim().toLowerCase().replace(/\s/g, "");
    const correct = content.correct_answer.toLowerCase().replace(/\s/g, "");
    const answerIsCorrect = normalised === correct;
    setIsCorrect(answerIsCorrect);
    setIsAnswered(true);

    if (answerIsCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCorrect();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeOffset.value = withSequence(
        withSpring(-10, { stiffness: 600 }),
        withSpring(10, { stiffness: 600 }),
        withSpring(-6, { stiffness: 600 }),
        withSpring(6, { stiffness: 600 }),
        withSpring(0, { stiffness: 600 })
      );
      onMistake();
    }
  };

  const borderColor = isAnswered
    ? isCorrect
      ? COLORS.success
      : COLORS.danger
    : COLORS.primary;

  return (
    <Animated.View style={[styles.container, shakeStyle]}>
      {/* Question */}
      <View style={styles.questionBox}>
        <Text style={styles.question}>{content.question}</Text>
      </View>

      {/* Fill-in prompt */}
      <View style={styles.promptRow}>
        {content.before_blank !== "" && (
          <Text style={styles.promptText}>{content.before_blank}</Text>
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.blankInput,
            { borderColor, borderWidth: 2.5 },
          ]}
          value={answer}
          onChangeText={setAnswer}
          placeholder="?"
          placeholderTextColor={COLORS.textMuted}
          editable={!isAnswered}
          keyboardType="default"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          onFocus={() => setKeyboardVisible(true)}
          onBlur={() => setKeyboardVisible(false)}
          autoFocus
        />
        {content.after_blank !== "" && (
          <Text style={styles.promptText}>{content.after_blank}</Text>
        )}
      </View>

      {/* Correct answer reveal */}
      {isAnswered && !isCorrect && (
        <View style={styles.correctReveal}>
          <Feather name="check-circle" size={16} color={COLORS.success} />
          <Text style={styles.correctText}>
            Correct answer: {content.correct_answer}
          </Text>
        </View>
      )}

      {/* Feedback */}
      <FeedbackBanner
        isCorrect={isCorrect}
        explanation={content.explanation}
        visible={isAnswered}
      />


      {/* Actions */}
      {isAnswered ? (
        <Button title="Continue" onPress={onNext} variant="primary" fullWidth size="lg" />
      ) : (
        <View style={styles.actions}>
          <Button
            title="Check Answer"
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            size="lg"
            disabled={!answer.trim()}
          />
          <HintButton
            hintsUsed={hintsUsed}
            hint={hintText}
            onUseHint={() => onUseHint?.(HINT_XP_COST)}
            onAIHelp={onAIHelp}
          />
        </View>
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
  promptRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promptText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  blankInput: {
    minWidth: 80,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.md,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
    backgroundColor: COLORS.primaryLight,
  },
  correctReveal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
  },
  correctText: {
    color: COLORS.successDark,
    fontWeight: "700",
    fontSize: 15,
  },
  actions: { gap: 12 },
  symbolBar: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  symbolBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "30",
  },
  symbolText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
});
