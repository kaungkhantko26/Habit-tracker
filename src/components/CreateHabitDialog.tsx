import { FormEvent, useEffect, useState } from "react";
import { colorOptions, habitPresets, weekdayOptions } from "../data/presets";
import type { NewHabitPayload } from "../types";

interface CreateHabitDialogProps {
  busy: boolean;
  open: boolean;
  onClose: () => void;
  onCreate: (payload: NewHabitPayload) => Promise<void>;
}

const initialState: NewHabitPayload = {
  name: "",
  emoji: "✨",
  category: "General",
  target_count: 1,
  unit: "time",
  frequency: "daily",
  active_days: null,
  color_token: "violet",
};

export function CreateHabitDialog({
  busy,
  open,
  onClose,
  onCreate,
}: CreateHabitDialogProps) {
  const [form, setForm] = useState<NewHabitPayload>(initialState);

  useEffect(() => {
    if (open) {
      setForm(initialState);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.frequency === "custom" && !(form.active_days?.length)) {
      return;
    }
    await onCreate({
      ...form,
      active_days: form.frequency === "custom" ? form.active_days ?? [] : null,
    });
  }

  function toggleDay(day: number) {
    const current = new Set(form.active_days ?? []);
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }

    setForm({ ...form, active_days: [...current].sort() });
  }

  return (
    <div className="dialog-shell" role="dialog" aria-modal="true">
      <div className="dialog-backdrop" onClick={onClose} />
      <div className="dialog panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Create Habit</div>
            <h3>Build a habit with real tracking</h3>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="preset-row">
          {habitPresets.map((preset) => (
            <button
              className="chip-button"
              key={preset.name}
              onClick={() => setForm({ ...preset })}
              type="button"
            >
              <span>{preset.emoji}</span>
              {preset.name}
            </button>
          ))}
        </div>

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Habit name</span>
              <input
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Morning walk"
                required
                value={form.name}
              />
            </label>
            <label className="field">
              <span>Emoji</span>
              <input
                maxLength={2}
                onChange={(event) => setForm({ ...form, emoji: event.target.value || "✨" })}
                value={form.emoji}
              />
            </label>
            <label className="field">
              <span>Category</span>
              <input
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                value={form.category}
              />
            </label>
            <label className="field">
              <span>Target count</span>
              <input
                min={1}
                onChange={(event) =>
                  setForm({ ...form, target_count: Math.max(1, Number(event.target.value)) })
                }
                type="number"
                value={form.target_count}
              />
            </label>
            <label className="field">
              <span>Unit</span>
              <input
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
                value={form.unit}
              />
            </label>
            <label className="field">
              <span>Frequency</span>
              <select
                onChange={(event) =>
                  setForm({
                    ...form,
                    frequency: event.target.value as NewHabitPayload["frequency"],
                  })
                }
                value={form.frequency}
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </div>

          {form.frequency === "custom" ? (
            <div className="field">
              <span>Active days</span>
              <div className="day-toggle-row">
                {weekdayOptions.map((option) => (
                  <button
                    className={
                      form.active_days?.includes(option.value) ? "day-toggle active" : "day-toggle"
                    }
                    key={option.label}
                    onClick={() => toggleDay(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <small className="field-help">Choose at least one day for a custom cadence.</small>
            </div>
          ) : null}

          <div className="field">
            <span>Accent</span>
            <div className="color-row">
              {colorOptions.map((color) => (
                <button
                  className={form.color_token === color.value ? "color-dot active" : "color-dot"}
                  data-color={color.value}
                  key={color.value}
                  onClick={() => setForm({ ...form, color_token: color.value })}
                  title={color.label}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="dialog-actions">
            <button className="ghost-button" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "Saving..." : "Create Habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
