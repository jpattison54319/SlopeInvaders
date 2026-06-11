-- 0003: Teacher-facing adaptivity transparency.
--
-- The student client already syncs each level's full `stats` jsonb (which now
-- includes an `adaptivity` object: the resolved difficulty tier, the EMA over
-- prior same-zone scores, and a plain-language reason). Expose that jsonb in
-- the dashboard payload so teachers can see *why* a level played at a given
-- tier. Students never see this — adaptivity stays invisible in the game UI.
--
-- Run after 0001_classroom.sql and 0002_versus.sql.

create or replace function public.get_class_dashboard(p_teacher_key uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classrooms;
begin
  select * into c from public.classrooms where teacher_key = p_teacher_key;
  if not found then
    raise exception 'class_not_found';
  end if;

  return json_build_object(
    'classroom', json_build_object('id', c.id, 'name', c.name, 'join_code', c.join_code),
    'students', coalesce((
      select json_agg(json_build_object(
        'student_id', s.id,
        'cadet_name', s.cadet_name,
        'last_seen', s.last_seen,
        'levels_completed', s.levels_completed,
        'total_stars', s.total_stars,
        'total_xp', s.total_xp,
        'rank', s.rank,
        'total_shots', s.total_shots,
        'total_hits', s.total_hits
      ) order by s.cadet_name)
      from public.students s where s.classroom_id = c.id
    ), '[]'::json),
    'level_results', coalesce((
      select json_agg(json_build_object(
        'student_id', r.student_id,
        'level_id', r.level_id,
        'stars', r.stars,
        'score', r.score,
        'accuracy', r.accuracy,
        'attempts', r.attempts,
        'completed_at', r.completed_at,
        'stats', r.stats
      ))
      from public.level_results r
      join public.students s on s.id = r.student_id
      where s.classroom_id = c.id
    ), '[]'::json)
  );
end;
$$;

-- `create or replace` preserves existing grants (anon execute from 0001), but
-- restate them so this migration is self-contained.
revoke all on function public.get_class_dashboard(uuid) from public, anon;
grant execute on function public.get_class_dashboard(uuid) to anon;
