-- Allow authenticated users to update only their own room_members row.
-- This supports ON CONFLICT DO UPDATE (upsert) safely under RLS.

alter table public.room_members enable row level security;

drop policy if exists members_update_self on public.room_members;
create policy members_update_self on public.room_members
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
