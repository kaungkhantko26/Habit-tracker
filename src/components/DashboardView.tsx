import type { CSSProperties } from "react";
import { completionCopy } from "../lib/stats";
import type { HabitProgress } from "../types";

interface DashboardViewProps {
  habits: HabitProgress[];
  streak: number;
  perfectDays: number;
  onAdjustHabit: (habitId: string, delta: number) => Promise<void>;
  onOpenCreate: () => void;
  pendingHabitId: string | null;
}

export function DashboardView({
  habits,
  streak,
  perfectDays,
  onAdjustHabit,
  onOpenCreate,
  pendingHabitId,
}: DashboardViewProps) {
  const completed = habits.filter((item) => item.completed).length;
  const completionRate = habits.length === 0 ? 0 : Math.round((completed / habits.length) * 100);
  const ringStyle = {
    "--progress-angle": `${(completionRate / 100) * 360}deg`,
  } as CSSProperties;

  return (
    <section className="view-section">
      <div className="hero-grid">
        <article className="hero-card panel">
          <div className="eyebrow">Daily Goal</div>
          <div className="hero-main">
            <div className="hero-ring" style={ringStyle}>
              <div className="hero-ring-value">{completionRate}%</div>
            </div>
            <div>
              <h2>Crushing it with live data</h2>
              <p>
                Every card here is backed by your own Supabase records. No placeholders, no fake
                streak counters.
              </p>
              <div className="chip-row">
                <span className="chip">{completed} habits completed today</span>
                <span className="chip">{perfectDays} perfect days unlocked</span>
              </div>
            </div>
          </div>
        </article>
        <article className="streak-card tone-surface" data-color="orange">
          <div className="eyebrow">Current Streak</div>
          <strong>{streak}</strong>
          <p>Two grace days keep momentum alive without breaking the ritual.</p>
        </article>
      </div>

      <article className="panel list-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Today&apos;s Quests</div>
            <h3>Track progress in under two seconds</h3>
          </div>
          <button className="ghost-button" onClick={onOpenCreate} type="button">
            Add Habit
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="empty-state">
            <h4>No habits scheduled for today</h4>
            <p>Create a habit to start logging progress and unlock analytics and badges.</p>
          </div>
        ) : (
          <div className="habit-list">
            {habits.map((progress) => {
              const isBusy = pendingHabitId === progress.habit.id;
              const percent = Math.min(100, Math.round((progress.value / progress.target) * 100));

              return (
                <article
                  className={progress.completed ? "habit-row tone-surface completed" : "habit-row tone-surface"}
                  data-color={progress.habit.color_token}
                  key={progress.habit.id}
                >
                  <div className="habit-icon">{progress.habit.emoji}</div>
                  <div className="habit-copy">
                    <div className="habit-title-row">
                      <h4>{progress.habit.name}</h4>
                      <span className="habit-category">{progress.habit.category}</span>
                    </div>
                    <p>{completionCopy(progress)}</p>
                    <div className="progress-track">
                      <span className="progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="habit-actions">
                    <button
                      className="count-button"
                      disabled={isBusy || progress.value === 0}
                      onClick={() => onAdjustHabit(progress.habit.id, -1)}
                      type="button"
                    >
                      −
                    </button>
                    <div className="habit-count">{progress.value}</div>
                    <button
                      className="count-button accent"
                      disabled={isBusy || progress.value >= progress.target}
                      onClick={() => onAdjustHabit(progress.habit.id, 1)}
                      type="button"
                    >
                      {progress.completed ? "✓" : "+"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
