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

## Cooperative class goals + teacher leaderboard (migration `0004_class_goals.sql`)

This reconciles an instructor request for a "leaderboard / collaborative
challenge" with the comparison-free principle above:

- **Students get a cooperative goal, never a ranking.** A class has at most one
  shared goal — total stars or total levels earned *together*. Students see only
  the collective class total vs. the target as a progress bar
  (`ClassroomScreen`); `get_class_goal` returns aggregate totals only — no
  per-student rows ever reach a learner. This is positive interdependence
  (everyone contributes), not social comparison. Pure display math lives in
  `src/cloud/classGoal.ts`.
- **The leaderboard is teacher-only.** `TeacherDashboardScreen` adds a sortable
  roster (stars / accuracy / levels / XP), derived client-side from the totals
  already synced — it is never shown to students. The teacher also sets/clears
  the cooperative goal there (`set_class_goal`, gated by the teacher key).
- Cloud-gated and additive like the rest: with no Supabase env it no-ops behind
  the offline notice and never touches scoring/adaptivity.

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
  accuracy) with per-student per-level drill-down. Each drill-down row shows a
  teacher-only adaptivity tier chip (support/standard/challenge) whose tooltip
  explains why the engine chose it (migration `0003_dashboard_adaptivity.sql`
  exposes the synced per-level stats; older rows simply omit the chip).
  This information must never be surfaced to students.
- `MenuScreen` has a Classroom entry; the teacher area is reachable from there.

## Phase 2 — Live 1v1 Versus (built)

Dr. Mario–style: **both players' boards render live on both screens**; each
player controls only their own board; it is a **race** — first to clear all
asteroids without losing all hearts wins. Reuses the campaign hit-detection,
coordinate math, and `GameBoard` rather than forking gameplay.

- **Schema:** `supabase/migrations/0002_versus.sql` adds the `matches` table
  (`classroom_id`, `host_student_id`, `host_name`, `guest_student_id`,
  `status: open|full|done|cancelled`, `level_seed`, `winner_student_id`) and the
  capability-gated RPCs `create_match`, `list_open_matches`, `join_match`,
  `get_match`, `cancel_match`, `finish_match`. `join_match` is an **atomic
  conditional update** (`guest_student_id IS NULL` AND same `classroom_id` AND
  not self) — enforcing the **2-player cap** and **same-class** rule. The
  `student_classroom()` helper maps a student to their class; RLS stays
  default-deny. Run it AFTER `0001_classroom.sql`.
- **Transport:** live state travels over a Supabase Realtime **broadcast**
  channel `match:<id>` (no per-shot table writes — no extra RLS/publication
  setup). `src/cloud/versus.ts` wraps both the RPCs and `openMatchChannel()`.
  Each player broadcasts a full `BoardSnapshot` on every change, plus `hello`
  and a terminal `over`; the opponent renders a read-only mirror.
- **Shared field:** both clients derive the identical starting field from the
  match's `level_seed` via the pure, seeded `buildVersusLevel(seed)`
  (`src/game/versus/field.ts`, mulberry32) — all quadrants, slope + intercept +
  x-offset + facing, 5 hearts, ship starting at the origin. Persisted gameplay
  keybindings (A/D by default) move the cannon, and `BoardSnapshot.xOffset`
  keeps the opponent mirror aligned; older snapshots
  without it default to the origin. Trajectory preview is always off on both
  the interactive board and read-only mirror so the duel assesses equation
  reasoning rather than visual line matching. The fired laser remains visible
  as outcome feedback. No level data crosses the wire.
- **Attack items:** `+2` (garbage asteroids) and `❄` freeze pickups spawn
  probabilistically on each player's own grid with a limited lifetime
  (`spawnItem`). Shooting one (the fired line crosses it) broadcasts an `attack`
  the opponent applies to their board. Items ride along in the snapshot so the
  mirror shows them; effects are data-driven (`ItemKind`) for easy extension.
- **Controller:** `src/game/versus/useVersusMatch.ts` owns the local board
  (reusing `evaluateShot`/`resolveDestroyed`/`lineBoardSegment`), the realtime
  channel, item economy, freeze, and win/lose latching (event-driven in the shot
  resolution, never an effect). `finish_match` records the winner best-effort.
- **UI / routing:** `src/app/VersusLobbyScreen.tsx` (create/join, polls
  `list_open_matches`, requires a joined class + cadet name) and
  `src/app/VersusMatchScreen.tsx` (interactive board + mirror, `EquationControls`,
  hearts, result overlay). App routes `{ name: 'versus' }` and
  `{ name: 'versus-match'; matchId; seed; role; opponentStudentId }`; the `versus`
  mode descriptor is now `available`.

### Test infra note

Konva's package `main` is its Node build, which hard-requires the native
`canvas` module (it can't build here). `vitest.setup.ts` intercepts Node's
`require('canvas')` with a tiny `DOMMatrix`/`createCanvas` shim and stubs the
jsdom 2D context, so the jsdom component tests (e.g. `App.test.tsx`) run without
`canvas`.
