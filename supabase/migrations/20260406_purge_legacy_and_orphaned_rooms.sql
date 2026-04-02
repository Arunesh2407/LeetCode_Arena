-- Remove stale rooms that predate the visibility fix plus any orphaned room rows.
-- Cascade foreign keys remove room_members, problems, assignments, and leaderboard rows.

do $$
declare
  legacy_cutoff timestamptz := timestamptz '2026-04-02 00:00:00+00';
begin
  delete from public.rooms r
  where r.created_at < legacy_cutoff
     or not exists (
       select 1
       from public.room_members rm
       where rm.room_id = r.id
     );
end
$$;
