-- Hard reset room_members SELECT policies to eliminate recursive/legacy policy conflicts

alter table public.room_members enable row level security;

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'room_members'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.room_members', p.policyname);
  end loop;
end
$$;

create policy members_select_self_only on public.room_members
  for select to authenticated
  using (user_id = auth.uid());
