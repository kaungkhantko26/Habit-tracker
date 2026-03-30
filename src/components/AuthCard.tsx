import { FormEvent, useState } from "react";

interface AuthCardProps {
  busy: boolean;
  error: string | null;
  onGoogleSignIn: () => Promise<void>;
  onPasswordSignIn: (email: string, password: string) => Promise<void>;
  onPasswordSignUp: (email: string, password: string, displayName: string) => Promise<string | null>;
}

export function AuthCard({
  busy,
  error,
  onGoogleSignIn,
  onPasswordSignIn,
  onPasswordSignUp,
}: AuthCardProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    if (mode === "signup") {
      const response = await onPasswordSignUp(email, password, displayName);
      if (response) {
        setNotice(response);
      }
      return;
    }

    await onPasswordSignIn(email, password);
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
        <div className="auth-mode-switch">
          <button
            className={mode === "signin" ? "auth-mode-button active" : "auth-mode-button"}
            disabled={busy}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={mode === "signup" ? "auth-mode-button active" : "auth-mode-button"}
            disabled={busy}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create Account
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label className="field">
              <span>Username</span>
              <input
                autoComplete="nickname"
                disabled={busy}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Alex"
                type="text"
                value={displayName}
                required
              />
            </label>
          ) : null}
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
          <label className="field">
            <span>Password</span>
            <input
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              disabled={busy}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              type="password"
              value={password}
              required
            />
          </label>
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <button className="oauth-button" disabled={busy} onClick={() => void onGoogleSignIn()} type="button">
          <span className="oauth-mark">G</span>
          Continue with Google
        </button>
        {notice ? <div className="notice success">{notice}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}
      </div>
    </div>
  );
}
