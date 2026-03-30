import type { ReactNode } from "react";
import type { AppView, LevelState } from "../types";

interface AppShellProps {
  children: ReactNode;
  currentView: AppView;
  displayName: string;
  level: LevelState;
  streak: number;
  todayCompleted: number;
  todayTarget: number;
  onOpenCreate: () => void;
  onSignOut: () => Promise<void>;
  onViewChange: (view: AppView) => void;
}

const navItems: Array<{ id: AppView; label: string; icon: string }> = [
  { id: "dashboard", label: "Dashboard", icon: "◧" },
  { id: "analytics", label: "Analytics", icon: "▥" },
  { id: "achievements", label: "Badges", icon: "✦" },
];

export function AppShell({
  children,
  currentView,
  displayName,
  level,
  streak,
  todayCompleted,
  todayTarget,
  onOpenCreate,
  onSignOut,
  onViewChange,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar panel">
        <div className="brand-block">
          <div className="eyebrow">HabitQuest</div>
          <h2>The playful architect</h2>
          <p>Habits, streaks, analytics, and achievements in one private workspace.</p>
        </div>
        <div className="level-card tone-surface" data-color="violet">
          <div className="label-row">
            <span>Level {level.level}</span>
            <span>{level.totalXp} XP</span>
          </div>
          <div className="progress-track">
            <span className="progress-fill" style={{ width: `${level.progressPercent}%` }} />
          </div>
          <p>{Math.max(0, level.nextLevelXp - level.totalXp)} XP to the next level</p>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={item.id === currentView ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-summary tone-surface" data-color="mint">
          <div className="metric">
            <span className="metric-value">{streak}</span>
            <span className="metric-label">day streak</span>
          </div>
          <div className="metric">
            <span className="metric-value">
              {todayCompleted}/{todayTarget || 0}
            </span>
            <span className="metric-label">today</span>
          </div>
        </div>
        <button className="primary-button" onClick={onOpenCreate} type="button">
          Add New Habit
        </button>
      </aside>

      <div className="content-stack">
        <header className="topbar panel">
          <div className="topbar-copy">
            <div className="eyebrow">Today</div>
            <h1>Welcome back, {displayName}</h1>
          </div>
          <div className="topbar-actions">
            <div className="stat-pill">
              <strong>{todayCompleted}</strong>
              <span>quests cleared</span>
            </div>
            <button className="ghost-button" onClick={onSignOut} type="button">
              Sign out
            </button>
          </div>
        </header>
        <main className="view-stack">{children}</main>
        <nav className="mobile-nav panel">
          {navItems.map((item) => (
            <button
              className={item.id === currentView ? "mobile-nav-item active" : "mobile-nav-item"}
              key={item.id}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          ))}
          <button className="mobile-nav-item accent" onClick={onOpenCreate} type="button">
            <span className="mobile-nav-icon">＋</span>
            <span className="mobile-nav-label">Add</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
