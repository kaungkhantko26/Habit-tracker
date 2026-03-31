create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  website_url text,
  github_url text,
  instagram_url text,
  x_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists instagram_url text;
alter table public.profiles add column if not exists x_url text;

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  emoji text not null default '✨',
  category text not null default 'General',
  target_count integer not null default 1 check (target_count >= 1),
  unit text not null default 'time',
  frequency text not null default 'daily' check (frequency in ('daily', 'weekdays', 'weekends', 'custom')),
  active_days smallint[] null,
  color_token text not null default 'violet' check (color_token in ('violet', 'mint', 'orange', 'blue', 'rose')),
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_on date not null,
  value integer not null default 1 check (value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create index if not exists habits_user_id_idx on public.habits (user_id);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, completed_on desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_habit_log()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists habit_logs_touch_updated_at on public.habit_logs;
create trigger habit_logs_touch_updated_at
before update on public.habit_logs
for each row execute procedure public.touch_habit_log();

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Habits are owned by creator" on public.habits;
create policy "Habits are owned by creator"
on public.habits for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Habit logs are owned by creator" on public.habit_logs;
create policy "Habit logs are owned by creator"
on public.habit_logs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar images" on storage.objects;
create policy "Users can upload their own avatar images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own avatar images" on storage.objects;
create policy "Users can update their own avatar images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own avatar images" on storage.objects;
create policy "Users can delete their own avatar images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
