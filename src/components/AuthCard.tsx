import { FormEvent, useState } from "react";

interface AuthCardProps {
  busy: boolean;
  error: string | null;
  recoveryMode: boolean;
  onPasswordSignIn: (email: string, password: string) => Promise<void>;
  onPasswordSignUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  onPasswordResetRequest: (email: string) => Promise<string | null>;
  onPasswordRecoveryUpdate: (password: string) => Promise<string | null>;
}

export function AuthCard({
  busy,
  error,
  recoveryMode,
  onPasswordSignIn,
  onPasswordSignUp,
  onPasswordResetRequest,
  onPasswordRecoveryUpdate,
}: AuthCardProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (recoveryMode) {
      if (password !== confirmPassword) {
        setNotice("Passwords do not match.");
        return;
      }
      const response = await onPasswordRecoveryUpdate(password);
      if (response) {
        setNotice(response);
      }
      return;
    }

    if (mode === "reset") {
      const response = await onPasswordResetRequest(email);
      if (response) {
        setNotice(response);
      }
      return;
    }

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
        {!recoveryMode ? (
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
        ) : null}
        <form className="auth-form" onSubmit={handleSubmit}>
          {recoveryMode ? (
            <>
              <label className="field">
                <span>New password</span>
                <input
                  autoComplete="new-password"
                  disabled={busy}
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                  value={password}
                  required
                />
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input
                  autoComplete="new-password"
                  disabled={busy}
                  minLength={8}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                  type="password"
                  value={confirmPassword}
                  required
                />
              </label>
            </>
          ) : null}
          {!recoveryMode && mode === "signup" ? (
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
          {!recoveryMode ? (
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
          ) : null}
          {!recoveryMode && mode !== "reset" ? (
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
          ) : null}
          <button className="primary-button" disabled={busy} type="submit">
            {busy
              ? "Please wait..."
              : recoveryMode
                ? "Update Password"
                : mode === "reset"
                  ? "Send Reset Link"
                  : mode === "signup"
                    ? "Create Account"
                    : "Sign In"}
          </button>
        </form>
        {!recoveryMode ? (
          <div className="auth-helpers">
            <button
              className="auth-link-button"
              disabled={busy}
              onClick={() => {
                setNotice(null);
                setMode(mode === "reset" ? "signin" : "reset");
              }}
              type="button"
            >
              {mode === "reset" ? "Back to sign in" : "Forgot password?"}
            </button>
          </div>
        ) : null}
        {!recoveryMode && mode === "signin" ? (
          <div className="field-help">
            If this account was created earlier with an email link and no password, use
            &nbsp;`Forgot password?` first.
          </div>
        ) : null}
        {notice ? <div className="notice success">{notice}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}
      </div>
    </div>
  );
}
