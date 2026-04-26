import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// ─── Replace these with your actual Supabase project credentials ─────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "your-anon-key";

// Custom storage adapter using Expo SecureStore for token persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          avatar_url: string | null;
          skill_level: "beginner" | "intermediate" | "advanced";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          xp_earned: number;
          mistakes: number;
          completed_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["progress"]["Row"], "id" | "completed_at">;
        Update: Partial<Database["public"]["Tables"]["progress"]["Insert"]>;
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string;
        };
        Insert: Omit<Database["public"]["Tables"]["streaks"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["streaks"]["Insert"]>;
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["achievements"]["Row"], "id" | "unlocked_at">;
        Update: Partial<Database["public"]["Tables"]["achievements"]["Insert"]>;
      };
    };
  };
};
