-- Room competition extensions: settings, assignments, solved sync, room-scoped leaderboard.

create extension if not exists pgcrypto;

alter table public.rooms
  add column if not exists duration_type text not null default 'unlimited' check (duration_type in ('days', 'months', 'unlimited')),
  add column if not exists duration_value integer,
  add column if not exists starts_at timestamptz not null default now(),
  add column if not exists ends_at timestamptz,
  add column if not exists daily_easy_count integer not null default 0,
  add column if not exists daily_medium_count integer not null default 1,
  add column if not exists daily_hard_count integer not null default 0,
  add column if not exists assignment_timezone text not null default 'UTC',
  add column if not exists assignment_time_utc time not null default '00:00:00';

alter table public.rooms
  drop constraint if exists rooms_daily_counts_nonnegative;
alter table public.rooms
  add constraint rooms_daily_counts_nonnegative
  check (
    daily_easy_count >= 0
    and daily_medium_count >= 0
    and daily_hard_count >= 0
    and (daily_easy_count + daily_medium_count + daily_hard_count) > 0
  );

alter table public.rooms
  drop constraint if exists rooms_duration_value_valid;
alter table public.rooms
  add constraint rooms_duration_value_valid
  check (
    (duration_type = 'unlimited' and duration_value is null)
    or (duration_type in ('days', 'months') and duration_value is not null and duration_value > 0)
  );

create table if not exists public.user_leetcode_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  profile_url text not null,
  verified_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_problems (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  leetcode_problem_id text,
  slug text not null,
  title text not null,
  difficulty text not null check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
  topics text[] not null default '{}',
  points integer not null check (points > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (room_id, slug)
);

create table if not exists public.room_daily_assignments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  assign_date date not null,
  problem_id uuid not null references public.room_problems(id) on delete cascade,
  difficulty text not null check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
  assigned_at timestamptz not null default now(),
  unique (room_id, assign_date, problem_id)
);

create table if not exists public.user_room_problem_status (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.room_problems(id) on delete cascade,
  assigned_date date not null,
  solved_at timestamptz,
  points_awarded integer not null default 0,
  source_submission_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, user_id, problem_id, assigned_date)
);

create table if not exists public.room_leaderboard_cache (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  total_points integer not null default 0,
  solved_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists idx_user_leetcode_profiles_username on public.user_leetcode_profiles(username);
create index if not exists idx_room_problems_room_id on public.room_problems(room_id);
create index if not exists idx_room_daily_assignments_room_date on public.room_daily_assignments(room_id, assign_date);
create index if not exists idx_user_room_status_room_user on public.user_room_problem_status(room_id, user_id);
create index if not exists idx_room_leaderboard_cache_room on public.room_leaderboard_cache(room_id, total_points desc);

alter table public.user_leetcode_profiles enable row level security;
alter table public.room_problems enable row level security;
alter table public.room_daily_assignments enable row level security;
alter table public.user_room_problem_status enable row level security;
alter table public.room_leaderboard_cache enable row level security;

-- Users manage only their own linked LeetCode profile.
drop policy if exists leetcode_profiles_select_self on public.user_leetcode_profiles;
create policy leetcode_profiles_select_self on public.user_leetcode_profiles
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists leetcode_profiles_insert_self on public.user_leetcode_profiles;
create policy leetcode_profiles_insert_self on public.user_leetcode_profiles
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists leetcode_profiles_update_self on public.user_leetcode_profiles;
create policy leetcode_profiles_update_self on public.user_leetcode_profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Room members can read catalog/assignments/score.
drop policy if exists room_problems_select_member on public.room_problems;
create policy room_problems_select_member on public.room_problems
  for select to authenticated
  using (
    exists (
      select 1
      from public.room_members rm
      where rm.room_id = room_problems.room_id
        and rm.user_id = auth.uid()
    )
  );

drop policy if exists room_assignments_select_member on public.room_daily_assignments;
create policy room_assignments_select_member on public.room_daily_assignments
  for select to authenticated
  using (
    exists (
      select 1
      from public.room_members rm
      where rm.room_id = room_daily_assignments.room_id
        and rm.user_id = auth.uid()
    )
  );

drop policy if exists room_status_select_member on public.user_room_problem_status;
create policy room_status_select_member on public.user_room_problem_status
  for select to authenticated
  using (
    exists (
      select 1
      from public.room_members rm
      where rm.room_id = user_room_problem_status.room_id
        and rm.user_id = auth.uid()
    )
  );

drop policy if exists room_status_insert_self on public.user_room_problem_status;
create policy room_status_insert_self on public.user_room_problem_status
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists room_status_update_self on public.user_room_problem_status;
create policy room_status_update_self on public.user_room_problem_status
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists room_leaderboard_select_member on public.room_leaderboard_cache;
create policy room_leaderboard_select_member on public.room_leaderboard_cache
  for select to authenticated
  using (
    exists (
      select 1
      from public.room_members rm
      where rm.room_id = room_leaderboard_cache.room_id
        and rm.user_id = auth.uid()
    )
  );

-- Room owners can curate problems and assignments from client-side tooling.
drop policy if exists room_problems_upsert_owner on public.room_problems;
create policy room_problems_upsert_owner on public.room_problems
  for all to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_problems.room_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_problems.room_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists room_assignments_upsert_owner on public.room_daily_assignments;
create policy room_assignments_upsert_owner on public.room_daily_assignments
  for all to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_daily_assignments.room_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_daily_assignments.room_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists room_leaderboard_upsert_owner on public.room_leaderboard_cache;
create policy room_leaderboard_upsert_owner on public.room_leaderboard_cache
  for all to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_leaderboard_cache.room_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_leaderboard_cache.room_id and r.owner_id = auth.uid()
    )
  );
