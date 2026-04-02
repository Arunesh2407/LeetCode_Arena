-- Restore authenticated room lookup so join-by-code works with client-side join flow.
-- Visibility in the Rooms page remains member-scoped by querying room_members for the current user.

drop policy if exists rooms_select_authenticated on public.rooms;
create policy rooms_select_authenticated on public.rooms
  for select to authenticated
  using (true);
