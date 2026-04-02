-- Allow multiple app accounts to reference the same LeetCode username.
-- This prevents room creation from failing when the profile row already exists elsewhere.

alter table public.user_leetcode_profiles
  drop constraint if exists user_leetcode_profiles_username_key;