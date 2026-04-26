// ─── User & Auth ────────────────────────────────────────────────────────────

export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type UserGoal = "pass_exams" | "improve_grades" | "just_for_fun" | "teach_others";
export type TopicCategory =
  | "arithmetic"
  | "algebra"
  | "geometry"
  | "word_problems"
  | "fractions"
  | "percentages"
  | "number_theory"
  | "statistics"
  | "probability"
  | "measurement"
  | "ratio";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  skill_level: SkillLevel;
  goal?: UserGoal;
  daily_target_minutes?: number;
  focus_topics?: TopicCategory[];
  created_at: string;
  is_premium?: boolean;
  premium_expires_at?: string | null;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export interface UserProgress {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  lessons_completed: number;
  last_activity_date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface StreakDay {
  date: string;
  completed: boolean;
}

// ─── Lessons ────────────────────────────────────────────────────────────────

export interface Topic {
  id: string;
  title: string;
  category: TopicCategory;
  icon: string;
  color: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  topic_id: string;
  title: string;
  description: string;
  xp_reward: number;
  order_index: number;
  is_locked: boolean;
  is_completed: boolean;
  steps: LessonStep[];
}

export type StepType = "explanation" | "multiple_choice" | "fill_blank";
export type StepDifficulty = "beginner" | "intermediate" | "advanced";

export interface LessonStep {
  id: string;
  lesson_id: string;
  type: StepType;
  order_index: number;
  difficulty?: StepDifficulty;
  content: ExplanationContent | MultipleChoiceContent | FillBlankContent;
}

export interface ExplanationContent {
  title: string;
  body: string;
  example?: string;
  tip?: string;
}

export interface MultipleChoiceContent {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface FillBlankContent {
  question: string;
  before_blank: string;
  after_blank: string;
  correct_answer: string;
  explanation: string;
}

// ─── Navigation ─────────────────────────────────────────────────────────────

export type RootStackParamList = {
  "(auth)": undefined;
  "(tabs)": undefined;
  "lesson/[id]": { lessonId: string; topicTitle: string };
  onboarding: undefined;
};

export type AuthStackParamList = {
  welcome: undefined;
  login: undefined;
  signup: undefined;
};

export type TabParamList = {
  index: undefined;
  learn: undefined;
  profile: undefined;
};
