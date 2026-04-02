-- Fix room_members select policy recursion so users can reliably read their own memberships.

alter table public.room_members enable row level security;

drop policy if exists members_select_in_room on public.room_members;
create policy members_select_in_room on public.room_members
  for select to authenticated
  using (user_id = auth.uid());
