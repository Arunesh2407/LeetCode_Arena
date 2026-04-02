-- Fix room visibility: only show rooms where user is a member, and add delete permission for owners

-- Update room select policy to restrict visibility to members only
drop policy if exists rooms_select_authenticated on public.rooms;
create policy rooms_select_authenticated on public.rooms
  for select to authenticated
  using (
    exists (
      select 1
      from public.room_members rm
      where rm.room_id = rooms.id
        and rm.user_id = auth.uid()
    )
  );

-- Add delete policy for room owners
drop policy if exists rooms_delete_owner on public.rooms;
create policy rooms_delete_owner on public.rooms
  for delete to authenticated
  using (auth.uid() = owner_id);
