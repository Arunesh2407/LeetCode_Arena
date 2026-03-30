-- Core room schema for persistent create/join and list/topic intake metadata.

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code varchar(6) not null unique,
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'LOCKED')),
  source_type text not null default 'manual' check (source_type in ('manual', 'list_url', 'topics')),
  list_url text,
  list_slug text,
  topic_tags text[] not null default '{}',
  question_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER', 'MEMBER')),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table if not exists public.room_list_imports (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  source_type text not null check (source_type in ('list_url', 'topics')),
  source_value text,
  status text not null default 'PENDING' check (status in ('PENDING', 'SUCCESS', 'FAILED')),
  imported_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_owner_id on public.rooms(owner_id);
create index if not exists idx_room_members_user_id on public.room_members(user_id);
create index if not exists idx_room_members_room_id on public.room_members(room_id);
create index if not exists idx_room_list_imports_room_id on public.room_list_imports(room_id);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_list_imports enable row level security;

-- Rooms are visible to signed-in users, writable by owner.
drop policy if exists rooms_select_authenticated on public.rooms;
create policy rooms_select_authenticated on public.rooms
  for select to authenticated
  using (true);

drop policy if exists rooms_insert_owner on public.rooms;
create policy rooms_insert_owner on public.rooms
  for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists rooms_update_owner on public.rooms;
create policy rooms_update_owner on public.rooms
  for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Members can read rooms they belong to; users can insert self-membership.
drop policy if exists members_select_in_room on public.room_members;
create policy members_select_in_room on public.room_members
  for select to authenticated
  using (
    auth.uid() in (
      select rm.user_id
      from public.room_members rm
      where rm.room_id = room_members.room_id
    )
  );

drop policy if exists members_insert_self on public.room_members;
create policy members_insert_self on public.room_members
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Room import logs are visible to members; only owner can insert/update.
drop policy if exists imports_select_member on public.room_list_imports;
create policy imports_select_member on public.room_list_imports
  for select to authenticated
  using (
    exists (
      select 1
      from public.room_members rm
      where rm.room_id = room_list_imports.room_id
        and rm.user_id = auth.uid()
    )
  );

drop policy if exists imports_insert_owner on public.room_list_imports;
create policy imports_insert_owner on public.room_list_imports
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.rooms r
      where r.id = room_list_imports.room_id
        and r.owner_id = auth.uid()
    )
  );

drop policy if exists imports_update_owner on public.room_list_imports;
create policy imports_update_owner on public.room_list_imports
  for update to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      where r.id = room_list_imports.room_id
        and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.rooms r
      where r.id = room_list_imports.room_id
        and r.owner_id = auth.uid()
    )
  );
