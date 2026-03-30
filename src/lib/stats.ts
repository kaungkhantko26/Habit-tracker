import { dayLabel, dayNumber, formatDateKey, getRecentDateKeys, shortDateLabel } from "./date";
import type {
  BadgeState,
  DailySummary,
  Habit,
  HabitLog,
  HabitProgress,
  LevelState,
} from "../types";

function logKey(habitId: string, date: string) {
  return `${habitId}:${date}`;
}

export function buildLogLookup(logs: HabitLog[]) {
  return new Map(logs.map((log) => [logKey(log.habit_id, log.completed_on), log]));
}

export function isHabitDueOnDate(habit: Habit, dateKey: string) {
  const weekday = dayNumber(dateKey);

  if (habit.frequency === "daily") {
    return true;
  }

  if (habit.frequency === "weekdays") {
    return weekday >= 1 && weekday <= 5;
  }

  if (habit.frequency === "weekends") {
    return weekday === 0 || weekday === 6;
  }

  return Boolean(habit.active_days?.includes(weekday));
}

export function buildHabitProgress(
  habits: Habit[],
  logs: HabitLog[],
  dateKey = formatDateKey(new Date()),
) {
  const lookup = buildLogLookup(logs);

  return habits
    .filter((habit) => isHabitDueOnDate(habit, dateKey))
    .map<HabitProgress>((habit) => {
      const log = lookup.get(logKey(habit.id, dateKey));
      const value = log?.value ?? 0;
      return {
        habit,
        value,
        target: habit.target_count,
        completed: value >= habit.target_count,
      };
    });
}

export function buildDailySeries(habits: Habit[], logs: HabitLog[], days = 84) {
  const lookup = buildLogLookup(logs);

  return getRecentDateKeys(days).map<DailySummary>((date) => {
    const dueHabits = habits.filter((habit) => isHabitDueOnDate(habit, date));
    const completed = dueHabits.reduce((total, habit) => {
      const value = lookup.get(logKey(habit.id, date))?.value ?? 0;
      return total + (value >= habit.target_count ? 1 : 0);
    }, 0);
    const target = dueHabits.length;
    const active = dueHabits.some((habit) => {
      const value = lookup.get(logKey(habit.id, date))?.value ?? 0;
      return value > 0;
    });

    return {
      date,
      label: dayLabel(date),
      completed,
      target,
      percentage: target === 0 ? 0 : Math.round((completed / target) * 100),
      active,
    };
  });
}

export function calculateCurrentStreak(series: DailySummary[]) {
  let streak = 0;
  let grace = 2;

  for (let index = series.length - 1; index >= 0; index -= 1) {
    const day = series[index];
    if (day.active) {
      streak += 1;
      continue;
    }

    if (grace > 0) {
      grace -= 1;
      continue;
    }

    break;
  }

  return streak;
}

export function calculateLongestStreak(series: DailySummary[]) {
  let best = 0;
  let current = 0;
  let grace = 2;

  for (const day of series) {
    if (day.active) {
      current += 1;
      best = Math.max(best, current);
      continue;
    }

    if (grace > 0) {
      grace -= 1;
      continue;
    }

    current = 0;
    grace = 2;
  }

  return best;
}

export function calculateLevel(habits: Habit[], logs: HabitLog[]): LevelState {
  const habitMap = new Map(habits.map((habit) => [habit.id, habit]));

  const totalXp = logs.reduce((total, log) => {
    const target = habitMap.get(log.habit_id)?.target_count ?? 1;
    return total + Math.min(log.value, target) * 12;
  }, 0);

  const level = Math.max(1, Math.floor(totalXp / 180) + 1);
  const currentLevelXp = (level - 1) * 180;
  const nextLevelXp = level * 180;
  const progressPercent = Math.min(
    100,
    Math.round(((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  );

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
    totalXp,
  };
}

export function calculatePerfectDays(series: DailySummary[]) {
  return series.filter((day) => day.target > 0 && day.percentage === 100).length;
}

export function calculateTotalCompletions(habits: Habit[], logs: HabitLog[]) {
  const habitMap = new Map(habits.map((habit) => [habit.id, habit]));

  return logs.reduce((total, log) => {
    const target = habitMap.get(log.habit_id)?.target_count ?? 1;
    return total + (log.value >= target ? 1 : 0);
  }, 0);
}

export function buildBadges(
  habits: Habit[],
  series: DailySummary[],
  level: LevelState,
) {
  const currentStreak = calculateCurrentStreak(series);
  const perfectDays = calculatePerfectDays(series);
  const totalCompletedDays = series.reduce((total, day) => total + day.completed, 0);

  const badges: BadgeState[] = [
    {
      id: "first-habit",
      title: "First Habit",
      description: "Create your first tracked habit.",
      icon: "🚀",
      accent: "violet",
      progress: habits.length,
      goal: 1,
      unlocked: habits.length >= 1,
    },
    {
      id: "streak-starter",
      title: "Streak Starter",
      description: "Build a 3-day active streak.",
      icon: "🔥",
      accent: "orange",
      progress: currentStreak,
      goal: 3,
      unlocked: currentStreak >= 3,
    },
    {
      id: "perfect-day",
      title: "Perfect Day",
      description: "Finish every due habit in a single day.",
      icon: "✅",
      accent: "mint",
      progress: perfectDays,
      goal: 1,
      unlocked: perfectDays >= 1,
    },
    {
      id: "architect",
      title: "Habit Architect",
      description: "Manage five live habits at once.",
      icon: "🧩",
      accent: "blue",
      progress: habits.length,
      goal: 5,
      unlocked: habits.length >= 5,
    },
    {
      id: "week-warrior",
      title: "Week Warrior",
      description: "Reach a 7-day streak with grace.",
      icon: "🏆",
      accent: "rose",
      progress: currentStreak,
      goal: 7,
      unlocked: currentStreak >= 7,
    },
    {
      id: "momentum",
      title: "Momentum",
      description: "Complete 30 habit-days.",
      icon: "⚡",
      accent: "violet",
      progress: totalCompletedDays,
      goal: 30,
      unlocked: totalCompletedDays >= 30,
    },
    {
      id: "perfect-week",
      title: "Perfect Week",
      description: "Stack seven perfect days.",
      icon: "🌟",
      accent: "orange",
      progress: perfectDays,
      goal: 7,
      unlocked: perfectDays >= 7,
    },
    {
      id: "level-five",
      title: "Level Five",
      description: "Level up through consistent completion.",
      icon: "🎖️",
      accent: "mint",
      progress: level.level,
      goal: 5,
      unlocked: level.level >= 5,
    },
  ];

  return badges.map((badge) => ({
    ...badge,
    progress: badge.id === "momentum" ? totalCompletedDays : badge.progress,
    unlocked: badge.progress >= badge.goal,
  }));
}

export function completionCopy(progress: HabitProgress) {
  return `${progress.value} / ${progress.target} ${progress.habit.unit}`;
}

export function summarizeWeek(series: DailySummary[]) {
  return series.slice(-7).map((day) => ({
    ...day,
    shortDate: shortDateLabel(day.date),
  }));
}
