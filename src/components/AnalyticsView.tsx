import { isHabitDueOnDate } from "../lib/stats";
import type { DailySummary, Habit, HabitLog } from "../types";

interface AnalyticsViewProps {
  habits: Habit[];
  logs: HabitLog[];
  series: DailySummary[];
  currentStreak: number;
  longestStreak: number;
  perfectDays: number;
}

function intensityClass(percentage: number) {
  if (percentage >= 100) return "cell-4";
  if (percentage >= 75) return "cell-3";
  if (percentage >= 50) return "cell-2";
  if (percentage > 0) return "cell-1";
  return "cell-0";
}

export function AnalyticsView({
  habits,
  logs,
  series,
  currentStreak,
  longestStreak,
  perfectDays,
}: AnalyticsViewProps) {
  const week = series.slice(-7);
  const recent = series.slice(-84);
  const habitStats = habits
    .map((habit) => {
      const dueDays = series.filter((day) => isHabitDueOnDate(habit, day.date)).length || 1;
      const completedDays = logs.filter((log) => log.habit_id === habit.id && log.value >= habit.target_count)
        .length;

      return {
        id: habit.id,
        name: habit.name,
        emoji: habit.emoji,
        rate: Math.min(100, Math.round((completedDays / dueDays) * 100)),
      };
    })
    .sort((left, right) => right.rate - left.rate)
    .slice(0, 4);

  return (
    <section className="view-section analytics-grid">
      <article className="panel wide-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Consistency Heatmap</div>
            <h3>Three months of real completion data</h3>
          </div>
        </div>
        <div className="heatmap-grid">
          {recent.map((day) => (
            <div
              className={`heatmap-cell ${intensityClass(day.percentage)}`}
              key={day.date}
              title={`${day.date}: ${day.completed}/${day.target} habits`}
            />
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Weekly Snapshot</div>
            <h3>Completion rate</h3>
          </div>
        </div>
        <div className="weekly-bars">
          {week.map((day) => (
            <div className="bar-column" key={day.date}>
              <div className="bar-track">
                <span className="bar-fill" style={{ height: `${day.percentage}%` }} />
              </div>
              <strong>{day.percentage}%</strong>
              <span>{day.label}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel stat-stack">
        <div className="tone-surface metric-card" data-color="violet">
          <span className="metric-kicker">Current streak</span>
          <strong>{currentStreak} days</strong>
        </div>
        <div className="tone-surface metric-card" data-color="orange">
          <span className="metric-kicker">Longest streak</span>
          <strong>{longestStreak} days</strong>
        </div>
        <div className="tone-surface metric-card" data-color="mint">
          <span className="metric-kicker">Perfect days</span>
          <strong>{perfectDays}</strong>
        </div>
      </article>

      <article className="panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Top Habits</div>
            <h3>Best completion rates</h3>
          </div>
        </div>
        <div className="habit-stat-list">
          {habitStats.length === 0 ? (
            <div className="empty-state compact">
              <p>Start tracking habits to unlock performance comparisons.</p>
            </div>
          ) : (
            habitStats.map((habit) => (
              <div className="habit-stat-row" key={habit.id}>
                <div>
                  <strong>
                    {habit.emoji} {habit.name}
                  </strong>
                </div>
                <div className="habit-stat-meter">
                  <div className="progress-track">
                    <span className="progress-fill" style={{ width: `${habit.rate}%` }} />
                  </div>
                  <span>{habit.rate}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
