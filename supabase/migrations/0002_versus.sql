-- Slope Invaders — Live 1v1 Versus matchmaking (Phase 2)
--
-- Adds a `matches` table + capability-gated RPCs on top of the Phase 1 classroom
-- model. Same account-free rules: a student is a device UUID + cadet name, and
-- only students in the SAME classroom can see/join each other's matches.
--
-- Live in-match state (board mirrors + attack effects) travels over a Supabase
-- Realtime *broadcast* channel keyed by match id — it does not touch these
-- tables, so no extra RLS/publication setup is needed. This table is only the
-- matchmaking authority (open/join/finish).
--
-- Run AFTER 0001_classroom.sql.

create table if not exists public.matches (
  id                 uuid primary key default gen_random_uuid(),
  classroom_id       uuid not null references public.classrooms(id) on delete cascade,
  host_student_id    uuid not null references public.students(id) on delete cascade,
  host_name          text not null default '',
  guest_student_id   uuid references public.students(id) on delete set null,
  guest_name         text,
  status             text not null default 'open',  -- open | full | done | cancelled
  level_seed         bigint not null,
  winner_student_id  uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists matches_open_idx
  on public.matches(classroom_id, status, created_at);

alter table public.matches enable row level security;  -- default-deny; RPCs only

-- Resolve the classroom a student belongs to (or null).
create or replace function public.student_classroom(p_student_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select classroom_id from public.students where id = p_student_id;
$$;

-- Host opens a match in their classroom. Stale open matches by the same host are
-- cancelled first so a student only ever has one live invite.
create or replace function public.create_match(p_student_id uuid, p_cadet_name text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_class uuid := public.student_classroom(p_student_id);
  m public.matches;
begin
  if v_class is null then
    raise exception 'not_in_class';
  end if;

  update public.matches set status = 'cancelled', updated_at = now()
  where host_student_id = p_student_id and status = 'open';

  insert into public.matches (classroom_id, host_student_id, host_name, level_seed)
  values (v_class, p_student_id, coalesce(trim(p_cadet_name), ''),
          floor(random() * 2000000000)::bigint)
  returning * into m;

  return row_to_json(m);
end;
$$;

-- Open matches in the caller's classroom (newest first), excluding their own.
create or replace function public.list_open_matches(p_student_id uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_class uuid := public.student_classroom(p_student_id);
begin
  if v_class is null then
    return '[]'::json;
  end if;
  return coalesce((
    select json_agg(json_build_object(
      'id', id, 'host_name', host_name, 'level_seed', level_seed, 'created_at', created_at
    ) order by created_at desc)
    from public.matches
    where classroom_id = v_class and status = 'open' and host_student_id <> p_student_id
  ), '[]'::json);
end;
$$;

-- Guest joins an open match. Atomic conditional update enforces the 2-player cap
-- AND the same-classroom rule; a lost race raises `match_unavailable`.
create or replace function public.join_match(
  p_match_id uuid, p_student_id uuid, p_cadet_name text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_class uuid := public.student_classroom(p_student_id);
  m public.matches;
begin
  if v_class is null then
    raise exception 'not_in_class';
  end if;

  update public.matches set
    guest_student_id = p_student_id,
    guest_name = coalesce(trim(p_cadet_name), ''),
    status = 'full',
    updated_at = now()
  where id = p_match_id
    and status = 'open'
    and guest_student_id is null
    and classroom_id = v_class
    and host_student_id <> p_student_id
  returning * into m;

  if not found then
    raise exception 'match_unavailable';
  end if;
  return row_to_json(m);
end;
$$;

-- Poll a match by id (capability: knowing the unguessable id is enough). Used by
-- the host to detect a guest joining.
create or replace function public.get_match(p_match_id uuid)
returns json
language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
begin
  select * into m from public.matches where id = p_match_id;
  if not found then
    return null;
  end if;
  return row_to_json(m);
end;
$$;

create or replace function public.cancel_match(p_match_id uuid, p_student_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.matches set status = 'cancelled', updated_at = now()
  where id = p_match_id and host_student_id = p_student_id and status in ('open', 'full');
end;
$$;

create or replace function public.finish_match(p_match_id uuid, p_winner_student_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.matches set
    status = 'done',
    winner_student_id = p_winner_student_id,
    updated_at = now()
  where id = p_match_id and status in ('open', 'full');
end;
$$;

-- Expose only the RPCs to the anon (public anon key) role.
revoke all on function public.create_match(uuid, text) from public, anon;
revoke all on function public.list_open_matches(uuid) from public, anon;
revoke all on function public.join_match(uuid, uuid, text) from public, anon;
revoke all on function public.get_match(uuid) from public, anon;
revoke all on function public.cancel_match(uuid, uuid) from public, anon;
revoke all on function public.finish_match(uuid, uuid) from public, anon;

grant execute on function public.create_match(uuid, text) to anon;
grant execute on function public.list_open_matches(uuid) to anon;
grant execute on function public.join_match(uuid, uuid, text) to anon;
grant execute on function public.get_match(uuid) to anon;
grant execute on function public.cancel_match(uuid, uuid) to anon;
grant execute on function public.finish_match(uuid, uuid) to anon;
