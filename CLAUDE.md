# Slope Invaders Claude Guide

Claude agents should read `.claude/CLAUDE.md` for the detailed project guide. This root file exists because some agent tools only scan repository-root instruction files.

Quick orientation:

- This is **Slope Invaders**, a Vite + React + TypeScript + React Konva educational math game.
- The repo folder is `SlopeBlasters`, but the game title is `Slope Invaders`.
- Campaign, endless Arcade, and (cloud-gated) live 1v1 Versus are playable.
- Arcade uses a separate pure simulation under `src/game/arcade/`: falling
  asteroids pause at vertices, swept collision permits mid-fall hits, three
  breaches end a run, and wave pressure has a `2.75s` reasoning-time floor.
  Personal records persist in `slope-invaders:arcade-records-v1` and appear in
  Pilot Profile; Arcade never awards Campaign XP/stars/badges. See
  `docs/agent/11-arcade-mode.md`.
- Campaign opens an atmospheric galaxy where zones are planets on a rotating
  dial. Clicking a planet zooms to a surface map with gold regions and faction
  banners that launch missions directly; "List view" keeps the classic fallback.
- `src/app/` contains app shell, mode/zone routing, settings, progress, stats, and adaptive tier wiring.
- `src/game/` contains gameplay, campaign data, components, audio, and pure game logic.
- Zones 1–8 are playable; each uses invisible rolling adaptive difficulty after its own first diagnostic level. Zone 1 is `y = mx`; Zone 2 adds the y-intercept (`y = mx + b`, half-step `b`, horizontal lines); Zone 3 is negative slopes in Quadrant IV (ship at top-left, slope-only with the y-intercept removed again so the lesson can't be bypassed); Zone 4 is the full grid / all four quadrants with slope + y-intercept + a facing-direction control; Zone 5 keeps the Zone 4 controls and adds walls/shields that block shots crossing them, so students must pick a line that reaches the target; Zone 6 is linked asteroids (one line clears a whole chain or nothing); Zone 7 adds friendly ships that scrub shots crossing them; Zone 8 is the moving cannon (`y = m(x − h) + b` via the x-offset control). The coordinate plane renders any-quadrant bounds.
- Walls block shots: `hitDetection.isPathBlocked`/`firstWallHit` (segment intersection, honoring `WallSpec.gaps`) stop a shot at the first wall on the ship→target path; the beam truncates there, the asteroid survives, and a blocked shot counts as a miss (so it costs a star). Each level keeps at least one clear line so 3 stars stays achievable.
- A per-level star rating (1–3) lives in `src/game/campaign/stars.ts` (3 = no misses & no hearts lost, 2 = ≤1 miss, 1 = completed); shown in the victory overlay and on planet level-banners, persisted in `slope-invaders:level-stars`.
- XP (`src/game/campaign/xp.ts`, persisted in `slope-invaders:xp`) rewards learning behavior per `docs/agent/03`: each win shows a per-bonus breakdown with reasons in the victory overlay, but only the improvement over that level's best run is banked — XP never subtracts and never rewards grinding. Lifetime XP maps to a pilot rank (never demotes).
- Badges (`src/game/campaign/badges.ts`, persisted in `slope-invaders:badges`) cover zone mastery, sharpshooting, and growth; never revoked, never keyed on calculator/tweak use, announced in the victory overlay. `useCampaignProgress.markComplete` returns the run's `CompletionRewards` (XP award + new badges).
- The Pilot Profile (`src/app/PilotProfileScreen.tsx`) is the private progress
  page, opened from the astronaut/profile icon. Keep it individual — no
  comparisons or leaderboards.
- An optional, account-free **classroom cloud** (Phase 1) lives in `src/cloud/`,
  backed by Supabase (`supabase/migrations/0001_classroom.sql`). Teachers create
  a class and get a dashboard; students join by class code and name a cadet;
  their localStorage progress syncs up (`ClassroomScreen`/`TeacherDashboardScreen`,
  a Classroom entry on the menu). It is additive — with no `VITE_SUPABASE_*` env
  vars (`isCloudEnabled()` false) the game runs exactly as before, fully offline,
  and sync is best-effort and never touches scoring/adaptivity. No accounts:
  students are a device UUID + cadet name; teachers hold an unguessable secret
  dashboard link (`?teacher=<key>`; `?class=<code>` prefills join). Storage keys
  `slope-invaders:{student-id,cadet-name,classroom,teacher-keys}`.
- **Live 1v1 Versus** (Phase 2, cloud-gated) is built: `supabase/migrations/0002_versus.sql`
  adds a `matches` table + RPCs (atomic `join_match` enforces the 2-player cap and
  same-class rule). Classmates create/join from `VersusLobbyScreen`, then race on
  live side-by-side boards (`VersusMatchScreen`) over a Supabase Realtime broadcast
  channel. The field is derived deterministically from a shared `level_seed`
  (`src/game/versus/field.ts`); `useVersusMatch` drives the board, items, and
  win/lose; `+2`/freeze attack pickups send effects to the opponent. Cloud-off and
  not-joined users see a notice. See `docs/agent/10-classroom-cloud.md` and
  `DEPLOYMENT.md`.
- The app uses a curated tactical cockpit system in `src/assets/ui/`, typed in
  `assetMap.ts`. Shooter-kit assets are primary; the robot appears only as
  Mission Control. See `docs/ASSET_SOURCES.md`.
- Smooth raster artwork can be processed with
  `scripts/pixelize_ui_assets.py`; review its `tmp/pixelized-ui/` preview before
  using `--in-place`.
- A line is infinite both ways but a shot fires one way: in Zone 4 the ship is a cannon — slope tilts the aim up/down and the facing control (left/right) picks the side. Facing left mirrors the aim across the ship (right fires `y = mx + b`, left fires `y = -mx + b`), the projectile always leaves the ship outward, the preview is bright forward / faded backward, and the equation + dashed line show the facing-mirrored line while the slope stepper keeps the dialed value.
- The in-level calculator is a free tool and must not penalize scoring/adaptivity; its dragged viewport position persists in `slope-invaders:calculator-position`.
- The learning goal sits in a full-width mission banner above the board (the old per-level teaching "callout" is gone).
- Levels can opt into a one-time guided spotlight tour on first open; the Tutorial uses it.
- Buttons use a shared 3D press treatment and generic click SFX; the actual Fire button opts out because it plays the laser SFX.
- Audio settings are opened from the top-right Settings button. Settings also has a "Change Controls" sub-screen for remapping the gameplay keyboard controls.
- Gameplay has keyboard controls that drive the equation/facing/fire (defaults Space fire, W/S y-intercept ±, A/D x-offset ∓/±, R/F slope ±, Q/E face left/right). Bindings are remappable and persisted (`slope-invaders:keybindings`); each key is gated by the level's allowed controls (Fire always works) and ignored while typing or while a shot animates.
- App-wide keyboard accessibility: skip-to-content link, modal focus traps (`useFocusTrap`), a `?` shortcuts help panel, and `S`/`P` shortcuts (Settings / Pilot Profile) that only work outside missions. Screens are lazy-loaded with a loading fallback; Konva/Supabase/React build into separate chunks.
- Adaptivity transparency is **teacher-only**: tier decisions are traced locally (`slope-invaders:adaptivity-trace`), synced level stats embed the resolved tier + plain-language reason, and the teacher dashboard drill-down shows it (migration `0003_dashboard_adaptivity.sql`). Students never see tiers/EMA anywhere.
- `docs/agent/` contains the foundational source-backed theory for game, pedagogy, adaptivity, UI/audio, and Zone 1 decisions. Consult it before changing design behavior.
- Always update `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, and relevant `docs/agent/` files whenever project architecture, flows, rules, dependencies, or design theory change.
- Run `npm test`, `npm run lint`, and `npm run build` before handoff.

See `.claude/CLAUDE.md` for full architecture, testing, docs, and git-hygiene details.
