create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  username text,
  avatar_url text,
  website_url text,
  github_url text,
  instagram_url text,
  x_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists instagram_url text;
alter table public.profiles add column if not exists x_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username is null or username ~ '^[a-z0-9_]{3,20}$');
  end if;
end
$$;

create unique index if not exists profiles_username_lower_key
on public.profiles (lower(username))
where username is not null;

create table if not exists public.friendships (
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a <> user_b),
  check (user_a < user_b)
);

create index if not exists friendships_user_a_idx on public.friendships (user_a);
create index if not exists friendships_user_b_idx on public.friendships (user_b);

create or replace function public.normalize_username(value text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(value, '')), '[^a-zA-Z0-9_]+', '', 'g'));
$$;

create or replace function public.generate_unique_username(seed text, profile_id uuid default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix integer := 0;
begin
  base_username := left(nullif(public.normalize_username(seed), ''), 20);

  if base_username is null then
    base_username := 'player';
  end if;

  if length(base_username) < 3 then
    base_username := rpad(base_username, 3, '0');
  end if;

  candidate := base_username;

  loop
    exit when not exists (
      select 1
      from public.profiles
      where lower(username) = lower(candidate)
        and (profile_id is null or id <> profile_id)
    );

    suffix := suffix + 1;
    candidate := left(base_username, greatest(3, 20 - char_length(suffix::text))) || suffix::text;
  end loop;

  return candidate;
end;
$$;

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

  update public.profiles
  set username = public.generate_unique_username(
    coalesce(
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),
    new.id
  )
  where id = new.id
    and username is null;

  return new;
end;
$$;

update public.profiles p
set username = public.generate_unique_username(
  coalesce(p.display_name, split_part(u.email, '@', 1)),
  p.id
)
from auth.users u
where p.id = u.id
  and p.username is null;

create or replace function public.search_profiles(search_query text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_friend boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_query text := public.normalize_username(search_query);
begin
  if auth.uid() is null or char_length(normalized_query) < 2 then
    return;
  end if;

  return query
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    exists (
      select 1
      from public.friendships f
      where (f.user_a = least(auth.uid(), p.id) and f.user_b = greatest(auth.uid(), p.id))
    ) as is_friend
  from public.profiles p
  where p.id <> auth.uid()
    and p.username is not null
    and p.username ilike normalized_query || '%'
  order by
    case when p.username = normalized_query then 0 else 1 end,
    p.username
  limit 12;
end;
$$;

create or replace function public.add_friend_by_username(friend_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  left_id uuid;
  right_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select p.id
  into target_id
  from public.profiles p
  where p.username = public.normalize_username(friend_username);

  if target_id is null then
    raise exception 'Username not found';
  end if;

  if target_id = auth.uid() then
    raise exception 'You cannot add yourself';
  end if;

  left_id := least(auth.uid(), target_id);
  right_id := greatest(auth.uid(), target_id);

  insert into public.friendships (user_a, user_b)
  values (left_id, right_id)
  on conflict (user_a, user_b) do nothing;
end;
$$;

create or replace function public.remove_friend(friend_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.friendships
  where user_a = least(auth.uid(), friend_profile_id)
    and user_b = greatest(auth.uid(), friend_profile_id);
end;
$$;

create or replace function public.get_friend_leaderboard()
returns table (
  profile_id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_xp bigint,
  completed_days bigint,
  level integer,
  rank bigint,
  is_you boolean
)
language sql
security definer
set search_path = public
as $$
  with members as (
    select auth.uid() as member_id
    union
    select case when f.user_a = auth.uid() then f.user_b else f.user_a end
    from public.friendships f
    where f.user_a = auth.uid() or f.user_b = auth.uid()
  ),
  scores as (
    select
      p.id as profile_id,
      p.username,
      p.display_name,
      p.avatar_url,
      coalesce(sum(least(l.value, h.target_count) * 12), 0)::bigint as total_xp,
      coalesce(sum(case when l.value >= h.target_count then 1 else 0 end), 0)::bigint as completed_days
    from members m
    join public.profiles p on p.id = m.member_id
    left join public.habits h on h.user_id = p.id
    left join public.habit_logs l on l.habit_id = h.id and l.user_id = p.id
    group by p.id, p.username, p.display_name, p.avatar_url
  )
  select
    s.profile_id,
    coalesce(s.username, public.generate_unique_username(coalesce(s.display_name, 'player'), s.profile_id)) as username,
    s.display_name,
    s.avatar_url,
    s.total_xp,
    s.completed_days,
    greatest(1, floor(s.total_xp::numeric / 180) + 1)::integer as level,
    row_number() over (order by s.total_xp desc, s.completed_days desc, coalesce(s.display_name, s.username)) as rank,
    s.profile_id = auth.uid() as is_you
  from scores s
  order by rank;
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
alter table public.friendships enable row level security;

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

drop policy if exists "Friendships are viewable by members" on public.friendships;
create policy "Friendships are viewable by members"
on public.friendships for select
using (auth.uid() = user_a or auth.uid() = user_b);

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
