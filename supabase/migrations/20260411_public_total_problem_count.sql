create or replace function public.get_total_problem_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint from public.room_problems;
$$;

revoke all on function public.get_total_problem_count() from public;
grant execute on function public.get_total_problem_count() to anon, authenticated;
