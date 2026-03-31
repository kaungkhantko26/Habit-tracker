import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthCard } from "./components/AuthCard";
import { AchievementsView } from "./components/AchievementsView";
import { AnalyticsView } from "./components/AnalyticsView";
import { AppShell } from "./components/AppShell";
import { CreateHabitDialog } from "./components/CreateHabitDialog";
import { DashboardView } from "./components/DashboardView";
import { OnboardingDialog } from "./components/OnboardingDialog";
import { ProfileDialog } from "./components/ProfileDialog";
import { starterTracks } from "./data/presets";
import { formatDateKey, subtractDays } from "./lib/date";
import { applyPwaUpdate, subscribeToPwaUpdate } from "./lib/pwa";
import { hasSupabaseEnv, supabase } from "./lib/supabase";
import {
  buildBadges,
  buildDailySeries,
  buildHabitProgress,
  calculateCurrentStreak,
  calculateLevel,
  calculateLongestStreak,
  calculatePerfectDays,
} from "./lib/stats";
import type {
  AppView,
  ColorToken,
  Habit,
  HabitLog,
  NewHabitPayload,
  Profile,
  ProfileUpdatePayload,
  StarterTrackId,
} from "./types";

function viewFromHash(): AppView {
  const candidate = window.location.hash.replace("#", "");
  if (candidate === "analytics" || candidate === "achievements") {
    return candidate;
  }
  return "dashboard";
}

function SetupState() {
  return (
    <div className="auth-shell">
      <div className="auth-card panel">
        <div className="eyebrow">Supabase Setup Required</div>
        <h1>Connect a real backend before you deploy.</h1>
        <p className="auth-copy">
          Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your local `.env` or hosting
          environment, then run the SQL from `supabase/schema.sql`. The app is already wired for
          live auth and live data.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(viewFromHash());
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mutationBusy, setMutationBusy] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      } else if (event === "SIGNED_OUT") {
        setRecoveryMode(false);
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setRecoveryMode(false);
      }

      setSession(nextSession);
      setError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user.id || !supabase) {
      setProfile(null);
      setHabits([]);
      setLogs([]);
      return;
    }

    void loadWorkspace(session.user.id);
  }, [session?.user.id]);

  useEffect(() => subscribeToPwaUpdate(() => setUpdateReady(true)), []);

  function handleHashChange() {
    setCurrentView(viewFromHash());
  }

  async function loadWorkspace(userId: string) {
    if (!supabase) {
      return;
    }

    setDataLoading(true);
    setError(null);

    const logsStartDate = formatDateKey(subtractDays(new Date(), 120));

    const [profileResult, habitsResult, logsResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("habits").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("completed_on", logsStartDate)
        .order("completed_on", { ascending: true }),
    ]);

    if (profileResult.error || habitsResult.error || logsResult.error) {
      setError(profileResult.error?.message ?? habitsResult.error?.message ?? logsResult.error?.message ?? "Failed to load workspace");
      setDataLoading(false);
      return;
    }

    setProfile(profileResult.data);
    setHabits(habitsResult.data as Habit[]);
    setLogs(logsResult.data as HabitLog[]);
    setDataLoading(false);
  }

  async function handlePasswordSignIn(email: string, password: string) {
    if (!supabase) {
      return;
    }

    setAuthBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setAuthBusy(false);
      return;
    }

    setAuthBusy(false);
  }

  async function handlePasswordSignUp(email: string, password: string, displayName: string) {
    if (!supabase) {
      return null;
    }

    setAuthBusy(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setAuthBusy(false);
      return null;
    }

    setAuthBusy(false);
    return "Account created. Check your email if Supabase confirmation is enabled, then sign in.";
  }

  async function handlePasswordResetRequest(email: string) {
    if (!supabase) {
      return null;
    }

    setAuthBusy(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (resetError) {
      setError(resetError.message);
      setAuthBusy(false);
      return null;
    }

    setAuthBusy(false);
    return "Password reset email sent. Open the link from your inbox to choose a new password.";
  }

  async function handlePasswordRecoveryUpdate(password: string) {
    if (!supabase) {
      return null;
    }

    setAuthBusy(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setAuthBusy(false);
      return null;
    }

    setAuthBusy(false);
    setRecoveryMode(false);
    return "Password updated. You can continue using the app now.";
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }

  async function handleCreateHabit(payload: NewHabitPayload) {
    if (!supabase || !session?.user.id) {
      return;
    }

    if (payload.frequency === "custom" && !(payload.active_days?.length)) {
      setError("Choose at least one active day for a custom habit.");
      return;
    }

    setMutationBusy(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("habits")
      .insert({
        ...payload,
        user_id: session.user.id,
      })
      .select("*")
      .single();

    if (insertError) {
      setError(insertError.message);
      setMutationBusy(false);
      return;
    }

    setHabits((current) => [...current, data as Habit]);
    setCreateOpen(false);
    setMutationBusy(false);
  }

  async function handleSaveProfile(payload: ProfileUpdatePayload) {
    if (!supabase || !session?.user.id) {
      return;
    }

    setMutationBusy(true);
    setError(null);

    const { data, error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        display_name: payload.display_name,
        avatar_url: payload.avatar_url || null,
        website_url: payload.website_url || null,
        github_url: payload.github_url || null,
        instagram_url: payload.instagram_url || null,
        x_url: payload.x_url || null,
      })
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      setMutationBusy(false);
      return;
    }

    setProfile(data as Profile);
    setProfileOpen(false);
    setMutationBusy(false);
  }

  async function handleAvatarUpload(file: File) {
    if (!supabase || !session?.user.id) {
      return null;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for the profile photo.");
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photos must be 5 MB or smaller.");
      return null;
    }

    setAvatarUploading(true);
    setError(null);

    const filePath = `${session.user.id}/avatar`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      setError(uploadError.message);
      setAvatarUploading(false);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUploading(false);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async function handleCompleteOnboarding(trackId: StarterTrackId, accent: ColorToken) {
    if (!supabase || !session?.user.id) {
      return;
    }

    const track = starterTracks.find((item) => item.id === trackId);
    if (!track) {
      return;
    }

    setOnboardingBusy(true);
    setError(null);

    const payload = track.habits.map((habit) => ({
      ...habit,
      color_token: accent,
      user_id: session.user.id,
    }));

    const { data, error: insertError } = await supabase.from("habits").insert(payload).select("*");

    if (insertError) {
      setError(insertError.message);
      setOnboardingBusy(false);
      return;
    }

    setHabits(data as Habit[]);
    setOnboardingBusy(false);
  }

  async function handleAdjustHabit(habitId: string, delta: number) {
    if (!supabase || !session?.user.id) {
      return;
    }

    const habit = habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }

    const today = formatDateKey(new Date());
    const existing = logs.find((log) => log.habit_id === habitId && log.completed_on === today);
    const current = existing?.value ?? 0;
    const next = Math.max(0, Math.min(habit.target_count, current + delta));

    if (next === current) {
      return;
    }

    setPendingHabitId(habitId);
    setError(null);

    if (next === 0 && existing) {
      const { error: deleteError } = await supabase.from("habit_logs").delete().eq("id", existing.id);
      if (deleteError) {
        setError(deleteError.message);
      } else {
        setLogs((currentLogs) => currentLogs.filter((log) => log.id !== existing.id));
      }
      setPendingHabitId(null);
      return;
    }

    if (existing) {
      const { data, error: updateError } = await supabase
        .from("habit_logs")
        .update({ value: next })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError) {
        setError(updateError.message);
      } else {
        setLogs((currentLogs) =>
          currentLogs.map((log) => (log.id === existing.id ? (data as HabitLog) : log)),
        );
      }

      setPendingHabitId(null);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("habit_logs")
      .insert({
        habit_id: habitId,
        user_id: session.user.id,
        completed_on: today,
        value: next,
      })
      .select("*")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setLogs((currentLogs) => [...currentLogs, data as HabitLog]);
    }

    setPendingHabitId(null);
  }

  function handleViewChange(view: AppView) {
    window.location.hash = view;
    setCurrentView(view);
  }

  if (!hasSupabaseEnv) {
    return <SetupState />;
  }

  if (authLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card panel">
          <div className="eyebrow">HabitQuest</div>
          <h1>Loading your workspace...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthCard
        busy={authBusy}
        error={error}
        recoveryMode={recoveryMode}
        onPasswordSignIn={handlePasswordSignIn}
        onPasswordSignUp={handlePasswordSignUp}
        onPasswordResetRequest={handlePasswordResetRequest}
        onPasswordRecoveryUpdate={handlePasswordRecoveryUpdate}
      />
    );
  }

  const todayHabits = buildHabitProgress(habits, logs);
  const dailySeries = buildDailySeries(habits, logs);
  const currentStreak = calculateCurrentStreak(dailySeries);
  const longestStreak = calculateLongestStreak(dailySeries);
  const perfectDays = calculatePerfectDays(dailySeries);
  const level = calculateLevel(habits, logs);
  const badges = buildBadges(habits, dailySeries, level);
  const displayName = profile?.display_name ?? session.user.email?.split("@")[0] ?? "Player";
  const completedToday = todayHabits.filter((habit) => habit.completed).length;
  const shouldShowOnboarding = !dataLoading && habits.length === 0;

  return (
    <>
      <AppShell
        currentView={currentView}
        displayName={displayName}
        level={level}
        profile={profile}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenCreate={() => setCreateOpen(true)}
        onSignOut={handleSignOut}
        onViewChange={handleViewChange}
        streak={currentStreak}
        todayCompleted={completedToday}
        todayTarget={todayHabits.length}
      >
        {updateReady ? (
          <div className="update-banner panel">
            <div className="update-banner-copy">
              <strong>New version available</strong>
              <span>Refresh to load the latest app update on this device.</span>
            </div>
            <button className="primary-button update-banner-action" onClick={applyPwaUpdate} type="button">
              Refresh now
            </button>
          </div>
        ) : null}
        {error ? <div className="notice error inline">{error}</div> : null}
        {dataLoading ? <div className="panel loading-panel">Syncing your workspace...</div> : null}
        {currentView === "dashboard" ? (
          <DashboardView
            habits={todayHabits}
            onAdjustHabit={handleAdjustHabit}
            onOpenCreate={() => setCreateOpen(true)}
            pendingHabitId={pendingHabitId}
            perfectDays={perfectDays}
            streak={currentStreak}
          />
        ) : null}
        {currentView === "analytics" ? (
          <AnalyticsView
            currentStreak={currentStreak}
            habits={habits}
            logs={logs}
            longestStreak={longestStreak}
            perfectDays={perfectDays}
            series={dailySeries}
          />
        ) : null}
        {currentView === "achievements" ? (
          <AchievementsView badges={badges} level={level} streak={currentStreak} />
        ) : null}
      </AppShell>
      <CreateHabitDialog
        busy={mutationBusy}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateHabit}
        open={createOpen}
      />
      <ProfileDialog
        busy={mutationBusy}
        fallbackName={displayName}
        onClose={() => setProfileOpen(false)}
        onSave={handleSaveProfile}
        onUploadAvatar={handleAvatarUpload}
        open={profileOpen}
        profile={profile}
        uploadingAvatar={avatarUploading}
      />
      <OnboardingDialog
        busy={onboardingBusy}
        onComplete={handleCompleteOnboarding}
        open={shouldShowOnboarding}
      />
    </>
  );
}
