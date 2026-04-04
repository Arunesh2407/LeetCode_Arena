-- Ensure room owners can read their own room rows even before membership write completes.
-- Keeps visibility private to owner/member while fixing create-room response under RLS.

drop policy if exists rooms_select_authenticated on public.rooms;
create policy rooms_select_authenticated on public.rooms
  for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.room_members rm
      where rm.room_id = rooms.id
        and rm.user_id = auth.uid()
    )
  );
