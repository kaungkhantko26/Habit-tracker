import { getProfileAvatarCandidates } from "../lib/avatar";
import { ProfileAvatar } from "./ProfileAvatar";
import type { FriendSearchResult, LeaderboardEntry } from "../types";

interface CommunityViewProps {
  actionBusyId: string | null;
  busy: boolean;
  currentUsername: string | null;
  leaderboard: LeaderboardEntry[];
  onAddFriend: (username: string) => Promise<void>;
  onRemoveFriend: (profileId: string) => Promise<void>;
  onOpenProfile: () => void;
  onSearchQueryChange: (value: string) => void;
  searchQuery: string;
  searchResults: FriendSearchResult[];
  searching: boolean;
}

function displayLabel(entry: { display_name: string | null; username: string }) {
  return entry.display_name?.trim() || `@${entry.username}`;
}

export function CommunityView({
  actionBusyId,
  busy,
  currentUsername,
  leaderboard,
  onAddFriend,
  onOpenProfile,
  onRemoveFriend,
  onSearchQueryChange,
  searchQuery,
  searchResults,
  searching,
}: CommunityViewProps) {
  const friendsOnly = leaderboard.filter((entry) => !entry.is_you);
  const topEntry = leaderboard[0] ?? null;
  const totalFriends = friendsOnly.length;
  const currentRank = leaderboard.find((entry) => entry.is_you)?.rank ?? 1;

  const hint =
    searchQuery.trim().length < 2
      ? "Type at least 2 characters to search by username."
      : searching
        ? "Searching usernames..."
        : `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} found.`;

  return (
    <section className="view-section community-grid">
      <article className="panel community-summary tone-surface" data-color="violet">
        <div className="eyebrow">Community</div>
        <h3>Friends leaderboard</h3>
        <p>
          Search by username, add friends instantly, and compare progress using real XP from your synced habits.
        </p>
        <div className="milestone-strip">
          <div className="milestone-card">
            <strong>{currentRank}</strong>
            <span>your rank</span>
          </div>
          <div className="milestone-card">
            <strong>{totalFriends}</strong>
            <span>friends added</span>
          </div>
          <div className="milestone-card">
            <strong>{topEntry ? topEntry.total_xp : 0}</strong>
            <span>top XP score</span>
          </div>
        </div>
        <div className="community-note">
          {currentUsername ? (
            <span>
              Friends can find you as <strong>@{currentUsername}</strong>
            </span>
          ) : (
            <span>
              Set a username in your profile so other people can find you.
            </span>
          )}
          <button className="ghost-button compact" onClick={onOpenProfile} type="button">
            {currentUsername ? "Edit Username" : "Set Username"}
          </button>
        </div>
      </article>

      <article className="panel community-search-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Find Friends</div>
            <h3>Search by username</h3>
          </div>
        </div>
        <label className="field">
          <span>Username</span>
          <input
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="@friendname"
            value={searchQuery}
          />
        </label>
        <div className="field-help">{hint}</div>
        <div className="community-list">
          {searchQuery.trim().length < 2 ? (
            <div className="empty-state compact">
              <strong>Search is waiting</strong>
              <span>Start typing a username like @alex to find people.</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="empty-state compact">
              <strong>No users found</strong>
              <span>Try a different username spelling or ask your friend to set their username first.</span>
            </div>
          ) : (
            searchResults.map((result) => {
              const label = displayLabel(result);
              const avatarCandidates = getProfileAvatarCandidates({ avatar_url: result.avatar_url });
              return (
                <div className="community-row" key={result.id}>
                  <div className="community-row-main">
                    <ProfileAvatar alt={label} fallbackSrcs={avatarCandidates} initials={label.slice(0, 2).toUpperCase()} />
                    <div className="community-copy">
                      <strong>{label}</strong>
                      <span>@{result.username}</span>
                    </div>
                  </div>
                  {result.is_friend ? (
                    <button
                      className="ghost-button compact"
                      disabled={busy && actionBusyId === result.id}
                      onClick={() => onRemoveFriend(result.id)}
                      type="button"
                    >
                      {busy && actionBusyId === result.id ? "Removing..." : "Remove"}
                    </button>
                  ) : (
                    <button
                      className="primary-button compact-inline"
                      disabled={busy && actionBusyId === result.username}
                      onClick={() => onAddFriend(result.username)}
                      type="button"
                    >
                      {busy && actionBusyId === result.username ? "Adding..." : "Add Friend"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </article>

      <article className="panel community-board-panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Leaderboard</div>
            <h3>Your circle ranked by XP</h3>
          </div>
        </div>
        <div className="community-list">
          {leaderboard.length === 0 ? (
            <div className="empty-state compact">
              <strong>No leaderboard yet</strong>
              <span>Add friends to compare your habit XP and completed quest-days.</span>
            </div>
          ) : (
            leaderboard.map((entry) => {
              const label = displayLabel(entry);
              const avatarCandidates = getProfileAvatarCandidates({ avatar_url: entry.avatar_url });
              return (
                <div className={entry.is_you ? "leaderboard-row you" : "leaderboard-row"} key={entry.profile_id}>
                  <div className="leaderboard-rank">#{entry.rank}</div>
                  <div className="community-row-main">
                    <ProfileAvatar alt={label} fallbackSrcs={avatarCandidates} initials={label.slice(0, 2).toUpperCase()} />
                    <div className="community-copy">
                      <strong>
                        {label}
                        {entry.is_you ? " (You)" : ""}
                      </strong>
                      <span>@{entry.username}</span>
                    </div>
                  </div>
                  <div className="leaderboard-stats">
                    <div className="leaderboard-stat">
                      <strong>{entry.total_xp}</strong>
                      <span>XP</span>
                    </div>
                    <div className="leaderboard-stat">
                      <strong>{entry.level}</strong>
                      <span>Level</span>
                    </div>
                    <div className="leaderboard-stat">
                      <strong>{entry.completed_days}</strong>
                      <span>Clears</span>
                    </div>
                  </div>
                  {!entry.is_you ? (
                    <button
                      className="ghost-button compact"
                      disabled={busy && actionBusyId === entry.profile_id}
                      onClick={() => onRemoveFriend(entry.profile_id)}
                      type="button"
                    >
                      {busy && actionBusyId === entry.profile_id ? "Removing..." : "Remove"}
                    </button>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </article>
    </section>
  );
}
