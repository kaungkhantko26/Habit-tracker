import { FormEvent, useEffect, useMemo, useState } from "react";
import { ProfileAvatar } from "./ProfileAvatar";
import { getProfileAvatarCandidates } from "../lib/avatar";
import type { Profile, ProfileUpdatePayload } from "../types";

interface ProfileDialogProps {
  busy: boolean;
  open: boolean;
  profile: Profile | null;
  fallbackName: string;
  onClose: () => void;
  onSave: (payload: ProfileUpdatePayload) => Promise<void>;
}

const emptyState: ProfileUpdatePayload = {
  display_name: "",
  avatar_url: "",
  website_url: "",
  github_url: "",
  instagram_url: "",
  x_url: "",
};

function normalizeUrl(value: string) {
  if (!value.trim()) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value.trim();
  }

  return `https://${value.trim()}`;
}

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileDialog({
  busy,
  open,
  profile,
  fallbackName,
  onClose,
  onSave,
}: ProfileDialogProps) {
  const [form, setForm] = useState<ProfileUpdatePayload>(emptyState);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      display_name: profile?.display_name ?? fallbackName,
      avatar_url: profile?.avatar_url ?? "",
      website_url: profile?.website_url ?? "",
      github_url: profile?.github_url ?? "",
      instagram_url: profile?.instagram_url ?? "",
      x_url: profile?.x_url ?? "",
    });
  }, [fallbackName, open, profile]);

  const previewName = form.display_name.trim() || fallbackName;
  const initials = useMemo(() => initialsFromName(previewName || "HQ"), [previewName]);
  const avatarCandidates = useMemo(() => getProfileAvatarCandidates(form), [form]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      display_name: form.display_name.trim(),
      avatar_url: normalizeUrl(form.avatar_url),
      website_url: normalizeUrl(form.website_url),
      github_url: normalizeUrl(form.github_url),
      instagram_url: normalizeUrl(form.instagram_url),
      x_url: normalizeUrl(form.x_url),
    });
  }

  return (
    <div className="dialog-shell" role="dialog" aria-modal="true">
      <div className="dialog-backdrop" onClick={onClose} />
      <div className="dialog panel">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Edit Profile</div>
            <h3>Identity and public links</h3>
          </div>
          <button className="ghost-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="profile-editor-preview tone-surface" data-color="violet">
          <ProfileAvatar alt={previewName} fallbackSrcs={avatarCandidates} initials={initials} size="large" />
          <div className="profile-editor-copy">
            <h4>{previewName}</h4>
            <p>Paste an image URL, GitHub profile, or site link and the app will try to detect the avatar automatically.</p>
          </div>
        </div>

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Username</span>
              <input
                maxLength={40}
                onChange={(event) => setForm({ ...form, display_name: event.target.value })}
                placeholder="Alex Chen"
                required
                value={form.display_name}
              />
            </label>
            <label className="field">
              <span>Profile photo URL</span>
              <input
                onChange={(event) => setForm({ ...form, avatar_url: event.target.value })}
                placeholder="Image URL or profile link"
                value={form.avatar_url}
              />
            </label>
            <label className="field">
              <span>Website</span>
              <input
                onChange={(event) => setForm({ ...form, website_url: event.target.value })}
                placeholder="https://your-site.com"
                value={form.website_url}
              />
            </label>
            <label className="field">
              <span>GitHub</span>
              <input
                onChange={(event) => setForm({ ...form, github_url: event.target.value })}
                placeholder="https://github.com/username"
                value={form.github_url}
              />
            </label>
            <label className="field">
              <span>Instagram</span>
              <input
                onChange={(event) => setForm({ ...form, instagram_url: event.target.value })}
                placeholder="https://instagram.com/username"
                value={form.instagram_url}
              />
            </label>
            <label className="field">
              <span>X / Twitter</span>
              <input
                onChange={(event) => setForm({ ...form, x_url: event.target.value })}
                placeholder="https://x.com/username"
                value={form.x_url}
              />
            </label>
          </div>

          <div className="dialog-actions">
            <div className="field-help">Use public image URLs only. No secrets or signed URLs here.</div>
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
