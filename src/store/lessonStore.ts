import { create } from "zustand";
import { Lesson, LessonStep, SkillLevel } from "../types";

// ─── Difficulty ───────────────────────────────────────────────────────────────
// delta: -1 = easier, 0 = normal, +1 = harder
export type DifficultyDelta = -1 | 0 | 1;

const CORRECT_STREAK_THRESHOLD = 3; // consecutive correct → increase
const MISTAKE_STREAK_THRESHOLD = 2; // consecutive wrong  → decrease

interface LessonState {
  activeLesson: Lesson | null;
  currentStepIndex: number;
  correctAnswers: number;
  mistakes: number;
  xpEarned: number;
  isComplete: boolean;
  showAIHelp: boolean;
  aiHelpContext: string;

  // ── Adaptive difficulty ──────────────────────────────────────────────────
  consecutiveCorrect: number;
  consecutiveMistakes: number;
  difficultyDelta: DifficultyDelta;
  lastDifficultyEvent: "increased" | "decreased" | null; // consumed by UI toast

  // Actions
  startLesson: (lesson: Lesson, skillLevel?: SkillLevel) => void;
  nextStep: () => void;
  recordCorrect: () => void;
  recordMistake: () => void;
  addXP: (amount: number) => void;
  completeLesson: () => void;
  openAIHelp: (context: string) => void;
  closeAIHelp: () => void;
  clearDifficultyEvent: () => void;
  resetLesson: () => void;

  // Computed helpers
  getCurrentStep: () => LessonStep | null;
  getProgress: () => number;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  activeLesson: null,
  currentStepIndex: 0,
  correctAnswers: 0,
  mistakes: 0,
  xpEarned: 0,
  isComplete: false,
  showAIHelp: false,
  aiHelpContext: "",

  // Adaptive difficulty initial state
  consecutiveCorrect: 0,
  consecutiveMistakes: 0,
  difficultyDelta: 0,
  lastDifficultyEvent: null,

  startLesson: (lesson, skillLevel = "beginner") => {
    // Filter steps: always include explanations + steps matching skill level
    // Steps with no difficulty tag are shown to everyone (backwards compat)
    const filteredSteps = lesson.steps.filter((s) => {
      if (s.type === "explanation") return true;
      if (!s.difficulty) return skillLevel === "beginner";
      if (skillLevel === "beginner") return s.difficulty === "beginner";
      if (skillLevel === "intermediate") return s.difficulty === "beginner" || s.difficulty === "intermediate";
      return true; // advanced sees all
    });

    const filteredLesson: Lesson = {
      ...lesson,
      steps: filteredSteps.length > 1 ? filteredSteps : lesson.steps,
    };

    set({
      activeLesson: filteredLesson,
      currentStepIndex: 0,
      correctAnswers: 0,
      mistakes: 0,
      xpEarned: 0,
      isComplete: false,
      showAIHelp: false,
      consecutiveCorrect: 0,
      consecutiveMistakes: 0,
      difficultyDelta: 0,
      lastDifficultyEvent: null,
    });
  },

  nextStep: () => {
    const { activeLesson, currentStepIndex } = get();
    if (!activeLesson) return;

    if (currentStepIndex < activeLesson.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      set({ isComplete: true });
    }
  },

  recordCorrect: () => {
    const { consecutiveCorrect, difficultyDelta } = get();
    const newStreak = consecutiveCorrect + 1;

    let newDelta = difficultyDelta;
    let event: "increased" | null = null;

    if (newStreak >= CORRECT_STREAK_THRESHOLD && difficultyDelta < 1) {
      newDelta = Math.min(1, difficultyDelta + 1) as DifficultyDelta;
      event = "increased";
    }

    set((state) => ({
      correctAnswers: state.correctAnswers + 1,
      consecutiveCorrect: event ? 0 : newStreak, // reset streak after trigger
      consecutiveMistakes: 0,
      difficultyDelta: newDelta,
      lastDifficultyEvent: event,
    }));
  },

  recordMistake: () => {
    const { consecutiveMistakes, difficultyDelta } = get();
    const newStreak = consecutiveMistakes + 1;

    let newDelta = difficultyDelta;
    let event: "decreased" | null = null;

    if (newStreak >= MISTAKE_STREAK_THRESHOLD && difficultyDelta > -1) {
      newDelta = Math.max(-1, difficultyDelta - 1) as DifficultyDelta;
      event = "decreased";
    }

    set((state) => ({
      mistakes: state.mistakes + 1,
      consecutiveMistakes: event ? 0 : newStreak, // reset streak after trigger
      consecutiveCorrect: 0,
      difficultyDelta: newDelta,
      lastDifficultyEvent: event,
    }));
  },

  addXP: (amount) => {
    set((state) => ({ xpEarned: state.xpEarned + amount }));
  },

  completeLesson: () => {
    set({ isComplete: true });
  },

  openAIHelp: (context) => {
    set({ showAIHelp: true, aiHelpContext: context });
  },

  closeAIHelp: () => {
    set({ showAIHelp: false, aiHelpContext: "" });
  },

  clearDifficultyEvent: () => {
    set({ lastDifficultyEvent: null });
  },

  resetLesson: () => {
    set({
      activeLesson: null,
      currentStepIndex: 0,
      correctAnswers: 0,
      mistakes: 0,
      xpEarned: 0,
      isComplete: false,
      showAIHelp: false,
      aiHelpContext: "",
      consecutiveCorrect: 0,
      consecutiveMistakes: 0,
      difficultyDelta: 0,
      lastDifficultyEvent: null,
    });
  },

  getCurrentStep: () => {
    const { activeLesson, currentStepIndex } = get();
    if (!activeLesson) return null;
    return activeLesson.steps[currentStepIndex] ?? null;
  },

  getProgress: () => {
    const { activeLesson, currentStepIndex } = get();
    if (!activeLesson || activeLesson.steps.length === 0) return 0;
    return (currentStepIndex / activeLesson.steps.length) * 100;
  },
}));
