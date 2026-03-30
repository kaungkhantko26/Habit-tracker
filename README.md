# HabitQuest

HabitQuest is a production-ready React app for the habit-tracker concept in this workspace. It replaces the static mockups with:

- Supabase Auth for real user accounts
- Supabase Postgres for persistent habits and daily logs
- Live dashboard progress, analytics, streaks, and achievement badges
- A deployable Vite build for Vercel, Netlify, or any static host

## Stack

- React 19
- TypeScript
- Vite
- Supabase

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local `.env` file and add:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. In the Supabase SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql).

4. Enable Email Auth in Supabase Authentication settings.

5. Start the app:

   ```bash
   npm run dev
   ```

## Deployment

This app is a standard static Vite frontend.

### Vercel

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

Add the same two environment variables in the Vercel project settings.

### Netlify

Build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```

Add the same Supabase environment variables in the Netlify site settings.

## Data model

- `profiles`: one row per auth user
- `habits`: a user-owned list of tracked habits
- `habit_logs`: per-day progress records for each habit

All tables use Row Level Security so the anon client can only read and write the authenticated user’s own records.
