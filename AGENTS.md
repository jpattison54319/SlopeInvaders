# Slope Invaders Agent Guide

This file is for OpenAI Codex and other agentic coding tools. Claude-specific tools can also read `.claude/CLAUDE.md`; keep these files aligned so every agent gets the same project truth.

## Keep Agent Guidance Current

Whenever you change architecture, user flows, learning design, storage keys, dependencies, major files, commands, testing expectations, or implementation rules, update these agent-facing files as part of the same work:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/CLAUDE.md`
- relevant files under `docs/agent/`

Do not leave these files describing an older version of the game.

## Foundational Design Docs

The `docs/agent/` folder contains the foundational theory behind design decisions in Slope Invaders. Treat it as source material for feature decisions, not as optional background reading.

- `docs/agent/00-agent-principles.md`: core rules for game-based learning decisions.
- `docs/agent/01-learning-design.md`: learning goals, campaign progression, feedback, reflection.
- `docs/agent/02-adaptivity-personalization.md`: adaptivity, customization, learner supports.
- `docs/agent/03-gamification-multiplayer.md`: XP, badges, multiplayer guardrails.
- `docs/agent/04-ui-audio-visual-design.md`: UI, cognitive load, visual/audio/accessibility guidance.
- `docs/agent/05-prototype-scope-zone-1.md`: current prototype scope for full Zone 1.
- `docs/agent/06-zone-2-intercepts.md`: Zone 2 (`y = mx + b`) learning focus, scaffold, and design decisions.
- `docs/agent/07-zone-3-negative-slopes.md`: Zone 3 (negative slopes, Quadrant IV) learning focus, scaffold, and design decisions.
- `docs/agent/08-zone-4-full-grid.md`: Zone 4 (full grid, facing direction, infinite-line-vs-one-way-shot) learning focus, scaffold, and design decisions.
- `docs/agent/09-zone-5-walls.md`: Zone 5 (shields/walls) learning focus, the wall-blocking model, star adherence, and SRL intent.
- `docs/agent/10-classroom-cloud.md`: the optional Supabase classroom cloud (teacher dashboards, account-free student join, progress sync) and the Phase 2 live-Versus matchmaking spec.
- `docs/agent/11-arcade-mode.md`: endless Arcade timing, swept collision,
  scoring, records, accessibility, and pedagogy guardrails.
- `docs/agent/sources.md`: bibliography-style source notes.

Before adding or changing gameplay, pedagogy, UI, audio, feedback, adaptivity, gamification, or multiplayer behavior, consult the relevant `docs/agent` file and keep the implementation rooted in that source-backed design theory.

## Project Snapshot

Slope Invaders is a Vite + React + TypeScript educational game. It teaches linear equations by letting students aim a ship/cannon with graphed equations and fire at asteroid weak points on a coordinate plane.

Current product flow:

- App starts inside a tactical space-cockpit mode-select screen. The coordinate
  board and core game art retain the pixel-art identity.
- Campaign, Arcade, and (cloud-gated) Versus are available modes.
- Arcade is an endless full-grid `y = mx + b` survival mode. Asteroids pause at
  five descending vertices, can be hit mid-fall through swept collision, and
  breach one of three shields if they leave the grid. Hold time decreases from
  `5.0s` to a `2.75s` floor; waves 1–2 show one target and Wave 3 onward can show
  two. Incomplete Campaign players receive a recommendation notice but may play.
- Arcade records are private/local (`slope-invaders:arcade-records-v1`) and
  appear in Pilot Profile. Arcade does not award Campaign XP, stars, badges, or
  adaptive data.
- Campaign opens an atmospheric galaxy where each zone is a planet on a rotating
  dial. Selecting a planet zooms to its surface map, where gold regions and
  faction banners launch levels directly. A "List view" toggle keeps the classic
  zone/level screens.
- Planet art lives in `src/assets/planets/` (wired via `assetMap`); each zone unlocks once the previous zone is fully cleared, and later zones are coming soon.
- Campaign levels use hearts, feedback, trajectory preview/scaffold settings, and reflections/debriefs.
- Zones 1–9 are playable; each uses rolling adaptive difficulty after its own first diagnostic level. Zone 1 is `y = mx`; Zone 2 adds the y-intercept (`y = mx + b`, horizontal lines); Zone 3 is negative slopes in Quadrant IV (slope-only, y-intercept removed again); Zone 4 is the full grid / all four quadrants with slope + y-intercept + a facing-direction control; Zone 5 keeps Zone 4 controls and adds walls/shields that block shots crossing them; Zone 6 is linked asteroids (one line must clear a whole chain); Zone 7 adds friendly ships that scrub any shot crossing them; Zone 8 is the moving cannon (`y = m(x − h) + b` via the x-offset control); Zone 9 is the typed-equation capstone ("Equation Forge") which disables all standard nudges/steppers, locks trajectory previews off, and requires typing equations directly into slots (decimals, negatives, and fractions are supported). The coordinate plane renders any-quadrant bounds.
- Walls block shots: `hitDetection.isPathBlocked`/`firstWallHit` (segment intersection, honoring `WallSpec.gaps`) stop a shot at the first wall on the ship→target path; a blocked shot counts as a miss (costs a star). A per-level 1–3 star rating (`src/game/campaign/stars.ts`, `slope-invaders:level-stars`) shows in the victory overlay + planet banners.
- XP rewards learning behavior per `docs/agent/03`: each win computes bonuses (`src/game/campaign/xp.ts`) shown with per-bonus reasons in the victory overlay, but only the improvement over that level's best run is banked (`slope-invaders:xp`) — XP never subtracts and never rewards grinding. Lifetime XP maps to a pilot rank that never demotes.
- Badges (`src/game/campaign/badges.ts`, persisted in `slope-invaders:badges`) reward zone mastery, sharpshooting, and growth behaviors; they are never revoked, never keyed on calculator/tweak use, and are announced in the victory overlay. `markComplete` returns the run's `CompletionRewards` (XP award + new badges + new cosmetics).
- Cosmetic rewards (`src/game/campaign/cosmetics.ts`, persisted in `slope-invaders:unlocks`) are unlockable ship hulls, laser styles, and cockpit themes earned by learning behavior — clearing a zone (one reward per zone), banking lifetime XP, collecting mastery stars, or earning a badge. They are purely visual: equipping never affects hit detection, scoring, hearts, or adaptivity. New unlocks are announced in the victory overlay; the Hangar (`src/app/HangarScreen.tsx`, opened from the menu and Pilot Profile) browses and equips them, locked items showing how to unlock. The equipped loadout persists in `slope-invaders:loadout` (`useLoadout`); the active theme recolors the whole app and board. Never gate cosmetics on speed, grinding, or tool use.
- The Pilot Profile (`src/app/PilotProfileScreen.tsx`) is the private progress
  page — rank/XP card, badge collection (locked badges framed as "Next mission",
  never failures), per-planet mastery bars, lifetime flight log. It opens from
  the astronaut/profile icon and must stay individual (no comparisons or
  leaderboards).
- Optional **classroom cloud** (Phase 1, account-free): a Supabase backend
  (`src/cloud/`) lets teachers create a class and get a dashboard, and lets
  students join by class code and name a cadet, syncing their existing
  localStorage progress. It is additive — with no `VITE_SUPABASE_*` env vars the
  game runs exactly as before, fully offline; sync is best-effort and never
  affects scoring/adaptivity. No accounts: students are a device UUID + cadet
  name; teachers hold an unguessable secret dashboard link.
- **Live 1v1 Versus** (Phase 2, cloud-gated) is built: classmates create/join a
  match (`matches` table + `0002_versus.sql` RPCs, atomic join enforces the
  2-player cap + same class), then race on live side-by-side boards over a
  Supabase Realtime broadcast channel. A shared `level_seed` derives the field
  deterministically (`src/game/versus/field.ts`); `+2`/freeze attack pickups send
  effects to the opponent. Both Versus boards hide the trajectory preview;
  only the fired laser supplies outcome feedback. Code: `src/cloud/versus.ts`, `src/game/versus/*`,
  `src/app/Versus{Lobby,Match}Screen.tsx`. See `docs/agent/10-classroom-cloud.md`
  and `DEPLOYMENT.md`.
- The visual shell uses a curated tactical UI bundle in `src/assets/ui/`.
  Shooter-kit art is the primary cockpit language; the robot is instructional
  Mission Control only. See `docs/ASSET_SOURCES.md`.
- A line is infinite both ways but a shot fires one way: Zone 4's ship is a cannon — slope tilts the aim up/down, the facing control (left/right) picks the side, and facing left mirrors the aim across the ship (right fires `y = mx + b`, left fires `y = -mx + b`). The projectile leaves the ship outward, the preview is bright forward / faded backward, and the equation/dashed line show the facing-mirrored slope while the stepper keeps the dialed value.
- In-level calculator opens from the game bar and is a free tool for stats/adaptivity.
- Top-right Settings controls music and SFX volume/mute, and has a "Change Controls" sub-screen for remapping keyboard controls.
- Gameplay keyboard controls drive the equation/facing/fire (defaults Space fire, W/S y-intercept ±, A/D x-offset ∓/±, R/F slope ±, Q/E face left/right). Bindings are remappable + persisted (`slope-invaders:keybindings`), gated by the level's allowed controls (Fire always works), and ignored while typing or mid-shot.
- App-wide keyboard accessibility: skip-to-content link, modal focus traps (`useFocusTrap`), a `?` shortcuts help panel, and `S`/`P` shortcuts (Settings / Pilot Profile) outside missions only. Screens lazy-load with a loading fallback (Konva/Supabase/React split into separate chunks).
- Adaptivity transparency is teacher-only: tier decisions are traced locally (`slope-invaders:adaptivity-trace`), synced level stats embed the resolved tier + reason, and the teacher dashboard drill-down shows it (migration `0003_dashboard_adaptivity.sql`). Never show tiers/EMA to students.
- Menu music: `src/assets/homescreen_background.mp3`.
- Gameplay music: `src/assets/in_game.mp3`.
- SFX: `src/assets/laser.wav` and `src/assets/explosion.wav`.

## Commands

```bash
npm run dev
npm test
npm run lint
npm run build
```

For UI verification:

```bash
npm run dev -- --host 127.0.0.1
```

## Key Files

- `src/app/App.tsx`: app shell, mode/zone/level/game routing, music/SFX settings, adaptive tier wiring.
- `src/app/MenuScreen.tsx`: mode select landing screen.
- `src/app/galaxy/`: the galaxy planet dial and planet-surface region/banner maps.
- `src/app/CampaignMapScreen.tsx`, `src/app/ZoneLevelsScreen.tsx`: the classic zone/level-list screens, kept as a "List view" fallback.
- `src/app/DebriefScreen.tsx`: end-of-zone reflection/debrief.
- `src/app/SettingsModal.tsx`: music and SFX controls.
- `src/app/useCampaignProgress.ts`: localStorage progress, rich stats, profile aggregate, XP banking, badge evaluation, unlock rules, adaptive tier selection.
- `src/game/Game.tsx`: gameplay state machine, hearts/losses, calculator toggle, stats instrumentation.
- `src/game/arcade/`: the separate endless Arcade simulation, swept collision,
  score/record rules, Konva board, and runtime screen.
- `src/app/ArcadeBriefingScreen.tsx`: Arcade rules, controls, and personal-best
  briefing before a run.
- `src/game/components/GuidedTour.tsx`: first-visit spotlight walkthrough used by levels that opt in.
- `src/game/audio/buttonClick.ts`: delegated global button-click SFX; respect `data-button-sfx="none"` for buttons with their own sound.
- `src/game/campaign/difficulty.ts`: adaptive tiers, `LevelStats`, scoring, tier config transforms.
- `src/game/campaign/levels/tutorial.ts`: Tutorial campaign level.
- `src/game/campaign/levels/zone1.ts`: Zone 1 levels and adaptive flags/variants.
- `src/game/campaign/levels/zone2.ts`: Zone 2 (`y = mx + b`) levels and adaptive flags/variants.
- `src/game/campaign/levels/zone3.ts`: Zone 3 (negative slopes, Quadrant IV) levels and adaptive flags/variants.
- `src/game/campaign/levels/zone4.ts`: Zone 4 (full grid, all quadrants, facing direction) levels and adaptive flags/variants.
- `src/game/campaign/levels/zone5.ts`: Zone 5 (shields/walls) levels and adaptive flags/variants.
- `src/game/campaign/levels/zone6.ts`–`zone8.ts`: Zone 6 (linked asteroids), Zone 7 (friendly ships), Zone 8 (moving cannon) levels.
- `src/game/campaign/zones.ts`: zone registry and navigation helpers.
- `src/game/campaign/xp.ts`: XP bonus computation, best-run banking, pilot ranks.
- `src/game/campaign/badges.ts`: badge registry and per-completion evaluation.
- `src/game/campaign/rewards.ts`: the `CompletionRewards` contract returned by `markComplete`.
- `src/app/PilotProfileScreen.tsx`: the private Pilot Profile (rank, badges, mastery, flight log).
- `src/app/ClassroomScreen.tsx` and `src/app/TeacherDashboardScreen.tsx`: the student class-join screen and the teacher create/dashboard screen (cloud-gated, with offline notices).
- `src/cloud/`: the classroom cloud layer — `supabaseClient.ts` (`isCloudEnabled()`), `identity.ts` (account-free device id + cadet name + class/teacher records), `classroom.ts` (RPC wrappers; `pushProgress` is best-effort/silent), and `progressPayload.ts` (pure snapshot → sync payload).
- `supabase/migrations/0001_classroom.sql`: the Postgres schema + RLS-locked `SECURITY DEFINER` RPCs (`create_classroom`, `join_classroom`, `sync_progress`, `get_class_dashboard`).
- `src/game/components/Calculator.tsx`, `src/game/components/calc.ts`, and `src/game/components/calculatorPosition.ts`: in-level calculator, safe expression evaluation, draggable placement, and persisted viewport-safe positioning.
- `src/game/components/TacticalButton.tsx`, `TacticalPanel.tsx`, and
  `CoachPanel.tsx`: shared tactical shell primitives.
- `src/game/components/`: Konva board and DOM gameplay UI.
- `src/game/logic/`: pure, tested math/game logic.
- `src/assets/assetMap.ts`: source of truth for sprite/icon/planet/audio and typed
  tactical UI imports.
- `src/assets/ui/`: curated, optimized production derivatives; do not copy the
  full source packs into the repository.
- `docs/ASSET_SOURCES.md`: tactical asset provenance, licensing, and usage rules.
- `scripts/pixelize_ui_assets.py`: non-destructive Pillow batch tool for making
  smooth raster assets fit the pixel-art language. It previews to
  `tmp/pixelized-ui/` unless explicitly run with `--in-place`.
- `src/styles/global.css`: global styling.

## Working Rules

- Keep app-shell work in `src/app/`; keep gameplay work in `src/game/`.
- Keep pure math and hit/scoring logic framework-free and covered by tests.
- Keep campaign pedagogy and sequencing consistent with `docs/agent/`.
- Keep Arcade separate from finite Campaign state and follow
  `docs/agent/11-arcade-mode.md`; timing must never fall below the documented
  reasoning floor.
- Preserve the tactical arcade cockpit around the existing pixel-art game. The
  graph and math must remain higher contrast than surrounding artwork.
- Keep all dynamic labels as HTML; do not introduce baked-in text assets.
- Do not expect CSS `image-rendering: pixelated` to pixelize smooth source art;
  use the preview-first raster script and visually inspect the result.
- Keep navigation utilities icon-only with accessible names and hover titles.
- Respect `prefers-reduced-motion` for decorative exhaust, bounce, and lighting.
- Use available assets first; do not replace asset-map imports with hardcoded URLs.
- Keep Settings as the only menu audio-control entry point.
- Do not display adaptive tier labels to learners; adaptation should be invisible/non-stigmatizing.
- The calculator is a free tool: record opens, but never penalize scoring/adaptivity for it.
- The calculator position is stored in `slope-invaders:calculator-position`; clamp restored positions to the current viewport so it cannot reopen off-screen.
- The learning goal shows in a full-width mission banner above the board (the old per-level teaching "callout" is gone).
- Levels can opt into a one-time guided spotlight tour on first open; the Tutorial uses it.
- Buttons should keep the shared 3D press feel and generic click SFX; the actual Fire button opts out because it plays the laser SFX.
- Do not commit `node_modules/`, `dist/`, caches, local secrets, or local Claude settings.
- Run `npm test`, `npm run lint`, and `npm run build` before claiming completion.
- For visible UI work, also verify the rendered app in a browser at desktop and mobile widths.
