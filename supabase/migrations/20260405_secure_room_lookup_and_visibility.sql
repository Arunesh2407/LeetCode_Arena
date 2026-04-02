-- Secure join-by-code lookup while keeping general room visibility member-scoped.

create or replace function public.lookup_room_by_code_for_join(p_code text)
returns table (
  id uuid,
  code text,
  name text,
  status text
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.code, r.name, r.status
  from public.rooms r
  where r.code = upper(trim(p_code))
  limit 1;
$$;

revoke all on function public.lookup_room_by_code_for_join(text) from public;
revoke all on function public.lookup_room_by_code_for_join(text) from anon;
revoke all on function public.lookup_room_by_code_for_join(text) from authenticated;
grant execute on function public.lookup_room_by_code_for_join(text) to authenticated;

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

drop policy if exists rooms_delete_owner on public.rooms;
create policy rooms_delete_owner on public.rooms
  for delete to authenticated
  using (auth.uid() = owner_id);
