import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated";
import { MultipleChoiceQuestion } from "../lesson/MultipleChoiceQuestion";
import { FillBlankQuestion } from "../lesson/FillBlankQuestion";
import { MultipleChoiceContent, FillBlankContent } from "../../types";

// Shared question renderer used by the lesson, practice and review screens.
// It dispatches between the multiple-choice and fill-in-the-blank components
// and wraps them in the standard slide transition. Change the `key` prop on
// each render (e.g. the current question index) to trigger the enter/exit
// animation when advancing.

interface QuizQuestionProps {
  type: string;
  content: MultipleChoiceContent | FillBlankContent;
  onCorrect: () => void;
  onMistake: () => void;
  onNext: () => void;
  onAIHelp?: () => void;
  hintsUsed?: number;
  onUseHint?: (xpCost: number) => void;
  style?: StyleProp<ViewStyle>;
}

const noop = () => {};

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  type,
  content,
  onCorrect,
  onMistake,
  onNext,
  onAIHelp = noop,
  hintsUsed,
  onUseHint,
  style,
}) => (
  <Animated.View
    entering={SlideInRight.duration(280).springify()}
    exiting={SlideOutLeft.duration(200)}
    style={style}
  >
    {type === "multiple_choice" ? (
      <MultipleChoiceQuestion
        content={content as MultipleChoiceContent}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onNext={onNext}
        onAIHelp={onAIHelp}
        hintsUsed={hintsUsed}
        onUseHint={onUseHint}
      />
    ) : (
      <FillBlankQuestion
        content={content as FillBlankContent}
        onCorrect={onCorrect}
        onMistake={onMistake}
        onNext={onNext}
        onAIHelp={onAIHelp}
        hintsUsed={hintsUsed}
        onUseHint={onUseHint}
      />
    )}
  </Animated.View>
);
