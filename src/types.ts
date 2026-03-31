export type Frequency = "daily" | "weekdays" | "weekends" | "custom";
export type ColorToken = "violet" | "mint" | "orange" | "blue" | "rose";
export type AppView = "dashboard" | "analytics" | "achievements" | "community";
export type StarterTrackId = "wellness" | "fitness" | "focus" | "learning";

export interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  website_url: string | null;
  github_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  created_at: string;
}

export interface ProfileUpdatePayload {
  display_name: string;
  username: string;
  avatar_url: string;
  website_url: string;
  github_url: string;
  instagram_url: string;
  x_url: string;
}

export interface FriendSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_friend: boolean;
}

export interface LeaderboardEntry {
  profile_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  completed_days: number;
  level: number;
  rank: number;
  is_you: boolean;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  category: string;
  target_count: number;
  unit: string;
  frequency: Frequency;
  active_days: number[] | null;
  color_token: ColorToken;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_on: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface DailySummary {
  date: string;
  label: string;
  completed: number;
  target: number;
  percentage: number;
  active: boolean;
}

export interface BadgeState {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: ColorToken;
  progress: number;
  goal: number;
  unlocked: boolean;
}

export interface HabitProgress {
  habit: Habit;
  value: number;
  target: number;
  completed: boolean;
}

export interface LevelState {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  totalXp: number;
}

export interface NewHabitPayload {
  name: string;
  emoji: string;
  category: string;
  target_count: number;
  unit: string;
  frequency: Frequency;
  active_days: number[] | null;
  color_token: ColorToken;
}

export interface StarterTrack {
  id: StarterTrackId;
  title: string;
  description: string;
  habits: NewHabitPayload[];
}
