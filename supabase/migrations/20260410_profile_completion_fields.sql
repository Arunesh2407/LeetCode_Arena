-- Integrate required account profile details into user profile storage.

alter table public.user_leetcode_profiles
  add column if not exists full_name text,
  add column if not exists age integer,
  add column if not exists description text,
  add column if not exists profile_completed_at timestamptz;

alter table public.user_leetcode_profiles
  drop constraint if exists user_leetcode_profiles_full_name_length;
alter table public.user_leetcode_profiles
  add constraint user_leetcode_profiles_full_name_length
  check (
    full_name is null
    or char_length(btrim(full_name)) between 2 and 100
  );

alter table public.user_leetcode_profiles
  drop constraint if exists user_leetcode_profiles_age_range;
alter table public.user_leetcode_profiles
  add constraint user_leetcode_profiles_age_range
  check (
    age is null
    or (age >= 13 and age <= 120)
  );

alter table public.user_leetcode_profiles
  drop constraint if exists user_leetcode_profiles_description_length;
alter table public.user_leetcode_profiles
  add constraint user_leetcode_profiles_description_length
  check (
    description is null
    or char_length(description) <= 500
  );

create index if not exists idx_user_leetcode_profiles_profile_completed_at
  on public.user_leetcode_profiles(profile_completed_at);
