# 10 — Classroom Cloud & Matchmaking

This doc covers the optional cloud layer that adds **teacher dashboards**,
**student class join**, and (Phase 2) **live 1v1 Versus matchmaking**. It is
additive to the offline-first design: with no Supabase env vars, the game runs
exactly as before on `localStorage` (see `docs/agent/02` and `04`).

## Principles (keep these)

- **No accounts, ever.** No login, no password, no email for students. Identity
  is a device UUID + a freely-chosen cadet name. Teachers are gated only by an
  unguessable capability key. This follows the project's "no account creation"
  product constraint.
- **localStorage stays canonical.** The cloud is a mirror for sharing/teacher
  visibility. A failed or disabled sync must never affect gameplay, scoring, or
  adaptivity. All sync is best-effort and silent.
- **Don't score the cloud.** Joining a class, syncing, or being on a dashboard
  never changes XP, badges, stars, or difficulty tiers (`docs/agent/03`). The
  dashboard only *reflects* the same stats the Pilot Profile shows.
- **Individual, not competitive, for the learner.** The Pilot Profile stays
  comparison-free. Class ranking/visibility is a *teacher* tool, not shown to
  students.

## Backend: Supabase

Hosted Postgres + Realtime + RLS. The public **anon key ships in the frontend**;
it is safe because every read/write goes through `SECURITY DEFINER` RPCs gated
on unguessable codes — RLS denies all direct table access (no policies created).

### Tables (`supabase/migrations/0001_classroom.sql`)

- `classrooms` — `id`, `name`, `join_code` (6 unambiguous chars), `teacher_key`
  (secret uuid), `created_at`.
- `students` — `id` (client device UUID), `classroom_id`, `cadet_name`,
  `joined_at`, `last_seen`, plus a denormalized summary
  (`levels_completed`, `total_stars`, `total_xp`, `rank`, `total_shots`,
  `total_hits`, `total_misses`, `total_hearts_lost`, `total_playtime_ms`).
- `level_results` — one row per `(student_id, level_id)`: `stars`, `score`,
  `accuracy`, `attempts`, `passed_first_try`, `completed_at`, full `stats jsonb`.

### RPCs (the only anon-callable surface)

- `create_classroom(name)` → `{classroom_id, join_code, teacher_key}`
- `join_classroom(join_code, student_id, cadet_name)` → `{classroom_id, name, join_code}`
- `sync_progress(student_id, cadet_name, summary, levels)` → upserts the
  student summary + `level_results` (ignores unknown students).
- `get_class_dashboard(teacher_key)` → `{classroom, students[], level_results[]}`
  — the only path that returns a whole class; gated entirely by the teacher key.

### Security model & tradeoff

Capability-based: knowing a `join_code` lets you join; knowing a `teacher_key`
lets you view that class. There is no per-user auth, so a leaked teacher link
exposes that class (documented in `DEPLOYMENT.md`). Acceptable for a classroom
prototype; could later be hardened with Supabase anonymous auth without changing
the table shapes.

## Frontend layer (`src/cloud/`)

- `supabaseClient.ts` — lazy client from `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`; `isCloudEnabled()`. Supabase Auth is disabled
  (`persistSession: false`).
- `identity.ts` — `getOrCreateStudentId()`, cadet name, joined classroom, and a
  remembered list of teacher classes. Storage keys:
  `slope-invaders:student-id`, `:cadet-name`, `:classroom`, `:teacher-keys`.
- `progressPayload.ts` — pure `buildProgressPayload(snapshot)` → `{summary,
  levels}`, built from the existing `ProfileStats` / `LevelStats` / stars / XP
  shapes. Unit-tested.
- `classroom.ts` — RPC wrappers: `createClassroom`, `joinClassroom`,
  `pushProgress` (best-effort/silent), `getDashboard`.

### Sync wiring

`useCampaignProgress` keeps a snapshot ref and (a) debounce-syncs on any
progress change via `pushProgress`, and (b) exposes `syncNow()` for an immediate
backfill right after a student joins a class. Both are no-ops when cloud is
disabled or no class is joined.

### UI / routing

- `App.tsx` adds `{ name: 'classroom' }` and `{ name: 'teacher-dashboard' }`
  screens and reads capability deep links on boot: `?teacher=<key>` opens a
  dashboard, `?class=<code>` prefills the join screen.
- `ClassroomScreen.tsx` — student cadet-name + class-code join, leave, name edit.
- `TeacherDashboardScreen.tsx` — create a class (shows the share code + secret
  bookmark link), and the roster (cadet, last active, levels, stars, XP/rank,
  accuracy) with per-student per-level drill-down.
- `MenuScreen` has a Classroom entry; the teacher area is reachable from there.

## Phase 2 — Live 1v1 Versus (designed, NOT yet built)

Dr. Mario–style: **both players' boards are rendered live on both screens**;
each player controls only their own board; it is a **race** — first to clear all
asteroids without losing all hearts wins. Keep the existing `Game.tsx`
asteroid/shot model; do not fork it.

- **Transport:** one Supabase Realtime **Broadcast** channel per match
  (`match:<id>`), scoped to the classroom. Each player broadcasts board deltas
  (equation state, shot fired, asteroid destroyed, hearts); the opponent renders
  a read-only mirror beside their own board.
- **Matchmaking:** a `matches` table (`id`, `classroom_id`, `host_student_id`,
  `guest_student_id`, `status: open|full|active|done`, `level_seed`,
  `winner_id`, timestamps). A `join_match` RPC does an atomic conditional update
  (`guest_student_id IS NULL` AND same `classroom_id`) — this enforces both the
  **2-player cap** and the **same-class** rule. Open matches are listed by
  classroom so only classmates see/join them.
- **Attack items:** non-required power-ups spawn probabilistically on the grid
  for a limited lifetime (shoot fast or they vanish). Shooting one sends a typed
  effect to the opponent over the broadcast channel — e.g. `+2 asteroids`, a
  short input freeze/timeout, etc. Effects are data-driven so new ones can be
  added without protocol changes.
- **Reuse:** add a `{ name: 'versus-match'; matchId }` screen wrapping two
  `Game`-derived boards (one interactive, one mirror), and flip the existing
  `versus` mode descriptor in `src/game/modes/index.ts` from `coming-soon`.

When building Phase 2, extend `0001_classroom.sql` with the `matches` table +
`join_match`/`create_match`/`finish_match` RPCs and keep the same
capability-gated, account-free model.
