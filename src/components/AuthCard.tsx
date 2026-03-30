import { FormEvent, useState } from "react";

interface AuthCardProps {
  busy: boolean;
  error: string | null;
  onSubmit: (email: string) => Promise<boolean>;
}

export function AuthCard({ busy, error, onSubmit }: AuthCardProps) {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const sent = await onSubmit(email);
    if (sent) {
      setNotice("Check your inbox for the secure sign-in link.");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card panel">
        <div className="eyebrow">HabitQuest</div>
        <h1>Turn the mockup into your daily ritual.</h1>
        <p className="auth-copy">
          Sign in with Supabase Auth and the app will create a private workspace for your habits,
          streaks, analytics, and achievements.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
              required
            />
          </label>
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? "Sending..." : "Send Magic Link"}
          </button>
        </form>
        {notice ? <div className="notice success">{notice}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}
      </div>
    </div>
  );
}
