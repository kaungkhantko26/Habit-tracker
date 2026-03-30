import type { BadgeState, LevelState } from "../types";

interface AchievementsViewProps {
  badges: BadgeState[];
  level: LevelState;
  streak: number;
}

export function AchievementsView({ badges, level, streak }: AchievementsViewProps) {
  const featured = badges.find((badge) => !badge.unlocked) ?? badges[0];
  const unlocked = badges.filter((badge) => badge.unlocked).length;

  return (
    <section className="view-section achievements-grid">
      <article className="panel featured-badge tone-surface" data-color={featured.accent}>
        <div className="eyebrow">Featured Badge</div>
        <div className="featured-badge-art">{featured.icon}</div>
        <h3>{featured.title}</h3>
        <p>{featured.description}</p>
        <div className="progress-track">
          <span
            className="progress-fill"
            style={{ width: `${Math.min(100, Math.round((featured.progress / featured.goal) * 100))}%` }}
          />
        </div>
        <small>
          {Math.min(featured.progress, featured.goal)} / {featured.goal}
        </small>
      </article>

      <article className="panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Progress</div>
            <h3>Level and streak milestones</h3>
          </div>
        </div>
        <div className="milestone-strip">
          <div className="milestone-card">
            <strong>{unlocked}</strong>
            <span>badges unlocked</span>
          </div>
          <div className="milestone-card">
            <strong>{level.level}</strong>
            <span>current level</span>
          </div>
          <div className="milestone-card">
            <strong>{streak}</strong>
            <span>day streak</span>
          </div>
        </div>
      </article>

      <article className="panel badge-grid-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Badge Cabinet</div>
            <h3>Locked and unlocked achievements</h3>
          </div>
        </div>
        <div className="badge-grid">
          {badges.map((badge) => (
            <article
              className={badge.unlocked ? "badge-card tone-surface unlocked" : "badge-card tone-surface"}
              data-color={badge.accent}
              key={badge.id}
            >
              <div className="badge-icon">{badge.icon}</div>
              <h4>{badge.title}</h4>
              <p>{badge.description}</p>
              <small>
                {Math.min(badge.progress, badge.goal)} / {badge.goal}
              </small>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

