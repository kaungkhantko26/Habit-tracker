import { useMemo, useState } from "react";
import { colorOptions, starterTracks } from "../data/presets";
import type { ColorToken, StarterTrackId } from "../types";

interface OnboardingDialogProps {
  busy: boolean;
  open: boolean;
  onComplete: (trackId: StarterTrackId, accent: ColorToken) => Promise<void>;
}

export function OnboardingDialog({ busy, open, onComplete }: OnboardingDialogProps) {
  const [trackId, setTrackId] = useState<StarterTrackId>("wellness");
  const [accent, setAccent] = useState<ColorToken>("violet");

  const track = useMemo(
    () => starterTracks.find((item) => item.id === trackId) ?? starterTracks[0],
    [trackId],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-shell" role="dialog" aria-modal="true">
      <div className="dialog-backdrop" />
      <div className="dialog panel onboarding-dialog">
        <div className="section-heading">
          <div>
            <div className="eyebrow">First Login Setup</div>
            <h3>Choose your starting quest line</h3>
          </div>
        </div>

        <p className="dialog-copy">
          Pick your main goal and HabitQuest will generate starter habits automatically instead of
          dropping you into an empty dashboard.
        </p>

        <div className="track-grid">
          {starterTracks.map((item) => (
            <button
              className={item.id === trackId ? "track-card active" : "track-card"}
              key={item.id}
              onClick={() => setTrackId(item.id)}
              type="button"
            >
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>

        <div className="field">
          <span>Preferred accent</span>
          <div className="color-row">
            {colorOptions.map((color) => (
              <button
                className={accent === color.value ? "color-dot active" : "color-dot"}
                data-color={color.value}
                key={color.value}
                onClick={() => setAccent(color.value)}
                title={color.label}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="panel onboarding-preview tone-surface" data-color={accent}>
          <div className="eyebrow">Preview</div>
          <h4>{track.title}</h4>
          <p>{track.description}</p>
          <div className="chip-row">
            {track.habits.map((habit) => (
              <span className="chip" key={habit.name}>
                {habit.emoji} {habit.name}
              </span>
            ))}
          </div>
        </div>

        <div className="dialog-actions">
          <div className="field-help">You can edit or add more habits after setup.</div>
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => void onComplete(track.id, accent)}
            type="button"
          >
            {busy ? "Creating..." : "Create Starter Quests"}
          </button>
        </div>
      </div>
    </div>
  );
}
