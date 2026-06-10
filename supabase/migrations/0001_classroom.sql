-- Slope Invaders — Classroom Cloud (Phase 1)
--
-- Account-free model: students are identified by a device UUID + a chosen cadet
-- name; teachers by possession of an unguessable teacher_key (capability link).
-- There is no Supabase Auth. Security is enforced by SECURITY DEFINER functions
-- that validate the caller's unguessable codes — direct table access is denied
-- by RLS (no policies are created, so the anon role can only EXECUTE the RPCs).
--
-- Run this once in the Supabase SQL editor (or via the Supabase CLI).

create extension if not exists pgcrypto;

-- --- Tables ----------------------------------------------------------------

create table if not exists public.classrooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  join_code   text not null unique,
  teacher_key uuid not null unique default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.students (
  id               uuid primary key,                 -- client-supplied device id
  classroom_id     uuid not null references public.classrooms(id) on delete cascade,
  cadet_name       text not null default '',
  joined_at        timestamptz not null default now(),
  last_seen        timestamptz not null default now(),
  -- denormalized summary for fast dashboard listing
  levels_completed int not null default 0,
  total_stars      int not null default 0,
  total_xp         int not null default 0,
  rank             text not null default 'Cadet',
  total_shots      int not null default 0,
  total_hits       int not null default 0,
  total_misses     int not null default 0,
  total_hearts_lost int not null default 0,
  total_playtime_ms bigint not null default 0
);

create index if not exists students_classroom_idx on public.students(classroom_id);

create table if not exists public.level_results (
  student_id       uuid not null references public.students(id) on delete cascade,
  level_id         text not null,
  stars            int not null default 0,
  score            numeric not null default 0,
  accuracy         numeric not null default 0,
  attempts         int not null default 0,
  passed_first_try boolean not null default false,
  completed_at     timestamptz,
  stats            jsonb,
  updated_at       timestamptz not null default now(),
  primary key (student_id, level_id)
);

-- Default-deny: enable RLS and create NO policies, so the anon role cannot read
-- or write the tables directly. All access goes through the functions below.
alter table public.classrooms    enable row level security;
alter table public.students      enable row level security;
alter table public.level_results enable row level security;

-- --- Helpers ---------------------------------------------------------------

-- 6-char join code from an unambiguous alphabet (no O/0/I/1).
create or replace function public.gen_join_code()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classrooms where join_code = code);
  end loop;
  return code;
end;
$$;

-- --- RPCs (the only anon-callable surface) ---------------------------------

create or replace function public.create_classroom(p_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classrooms;
begin
  insert into public.classrooms (name, join_code)
  values (coalesce(nullif(trim(p_name), ''), 'Untitled Class'), public.gen_join_code())
  returning * into c;
  return json_build_object(
    'classroom_id', c.id,
    'name', c.name,
    'join_code', c.join_code,
    'teacher_key', c.teacher_key
  );
end;
$$;

create or replace function public.join_classroom(
  p_join_code text,
  p_student_id uuid,
  p_cadet_name text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.classrooms;
begin
  select * into c from public.classrooms
  where join_code = upper(trim(p_join_code));
  if not found then
    raise exception 'class_not_found';
  end if;

  insert into public.students (id, classroom_id, cadet_name)
  values (p_student_id, c.id, coalesce(trim(p_cadet_name), ''))
  on conflict (id) do update
    set classroom_id = excluded.classroom_id,
        cadet_name   = coalesce(nullif(excluded.cadet_name, ''), public.students.cadet_name),
        last_seen    = now();

  return json_build_object('classroom_id', c.id, 'name', c.name, 'join_code', c.join_code);
end;
$$;

create or replace function public.sync_progress(
  p_student_id uuid,
  p_cadet_name text,
  p_summary jsonb,
  p_levels jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  lvl jsonb;
begin
  -- Only sync for students who have joined a class. Unknown ids are ignored
  -- (best-effort: a stale client must never error gameplay).
  if not exists (select 1 from public.students where id = p_student_id) then
    return;
  end if;

  update public.students set
    cadet_name        = coalesce(nullif(trim(p_cadet_name), ''), cadet_name),
    last_seen         = now(),
    levels_completed  = coalesce((p_summary->>'levelsCompleted')::int, levels_completed),
    total_stars       = coalesce((p_summary->>'totalStars')::int, total_stars),
    total_xp          = coalesce((p_summary->>'totalXp')::int, total_xp),
    rank              = coalesce(p_summary->>'rank', rank),
    total_shots       = coalesce((p_summary->>'totalShots')::int, total_shots),
    total_hits        = coalesce((p_summary->>'totalHits')::int, total_hits),
    total_misses      = coalesce((p_summary->>'totalMisses')::int, total_misses),
    total_hearts_lost = coalesce((p_summary->>'totalHeartsLost')::int, total_hearts_lost),
    total_playtime_ms = coalesce((p_summary->>'totalPlaytimeMs')::bigint, total_playtime_ms)
  where id = p_student_id;

  if p_levels is not null then
    for lvl in select * from jsonb_array_elements(p_levels) loop
      insert into public.level_results (
        student_id, level_id, stars, score, accuracy, attempts,
        passed_first_try, completed_at, stats, updated_at
      ) values (
        p_student_id,
        lvl->>'levelId',
        coalesce((lvl->>'stars')::int, 0),
        coalesce((lvl->>'score')::numeric, 0),
        coalesce((lvl->>'accuracy')::numeric, 0),
        coalesce((lvl->>'attempts')::int, 0),
        coalesce((lvl->>'passedFirstTry')::boolean, false),
        case when lvl ? 'completedAt'
             then to_timestamp((lvl->>'completedAt')::bigint / 1000.0) end,
        lvl->'stats',
        now()
      )
      on conflict (student_id, level_id) do update set
        stars            = excluded.stars,
        score            = excluded.score,
        accuracy         = excluded.accuracy,
        attempts         = excluded.attempts,
        passed_first_try = excluded.passed_first_try,
        completed_at     = excluded.completed_at,
        stats            = excluded.stats,
        updated_at       = now();
    end loop;
  end if;
end;
$$;

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
        'completed_at', r.completed_at
      ))
      from public.level_results r
      join public.students s on s.id = r.student_id
      where s.classroom_id = c.id
    ), '[]'::json)
  );
end;
$$;

-- Expose only the RPCs to the anonymous (public anon key) role.
revoke all on function public.create_classroom(text) from public, anon;
revoke all on function public.join_classroom(text, uuid, text) from public, anon;
revoke all on function public.sync_progress(uuid, text, jsonb, jsonb) from public, anon;
revoke all on function public.get_class_dashboard(uuid) from public, anon;

grant execute on function public.create_classroom(text) to anon;
grant execute on function public.join_classroom(text, uuid, text) to anon;
grant execute on function public.sync_progress(uuid, text, jsonb, jsonb) to anon;
grant execute on function public.get_class_dashboard(uuid) to anon;
