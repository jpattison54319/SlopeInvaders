# Slope Invaders Agent Guide

This repository contains **Slope Invaders**, a browser-based educational math game built as a greenfield prototype. The repo folder is named `SlopeBlasters`, but the game title and UI copy use **Slope Invaders**.

Use this guide for Claude Code, OpenAI Codex, and other coding agents. Keep it aligned with the root `AGENTS.md` and `CLAUDE.md` files so every agent starts from the same project truth.

## Keep Agent Guidance Current

Any time an agent changes architecture, user flows, learning design, storage keys, dependencies, major files, commands, testing expectations, or implementation rules, it must update the agent-facing guidance as part of the same change:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/CLAUDE.md`
- relevant files under `docs/agent/`

Do not leave these files stale. If a change affects how future agents should reason about the project, document it here and in the appropriate root agent file.

## Foundational Design Docs

The `docs/agent/` directory is the foundational theory behind decisions in Slope Invaders. It is rooted in source material summarized in `docs/agent/sources.md`, and should guide game, pedagogy, adaptivity, UI, audio, and accessibility decisions.

Important docs:

- `docs/agent/00-agent-principles.md`: core rules for keeping the game educational rather than a worksheet with decoration.
- `docs/agent/01-learning-design.md`: learning goals, campaign sequencing, feedback, and reflection.
- `docs/agent/02-adaptivity-personalization.md`: adaptivity, customization, learner supports, and non-stigmatizing personalization.
- `docs/agent/03-gamification-multiplayer.md`: XP, badges, stars, cosmetics, and multiplayer guardrails.
- `docs/agent/04-ui-audio-visual-design.md`: interface clarity, cognitive load, visual style, audio, and accessibility.
- `docs/agent/05-prototype-scope-zone-1.md`: concrete prototype scope for Tutorial + Zone 1.
- `docs/agent/06-zone-2-intercepts.md`: Zone 2 (`y = mx + b`) learning focus, scaffold, and design decisions (horizontal-line "cheese", two-point mastery).
- `docs/agent/07-zone-3-negative-slopes.md`: Zone 3 (negative slopes, Quadrant IV) learning focus, scaffold, and design decisions (slope-only to force negative reasoning, default `m = 0`, any-quadrant rendering).
- `docs/agent/08-zone-4-full-grid.md`: Zone 4 (full grid, all quadrants, facing-direction control) learning focus, scaffold, and design decisions (infinite line vs one-way shot, two-tone preview, ≥1 asteroid per quadrant, True/False reflection).
- `docs/agent/09-zone-5-walls.md`: Zone 5 (shields/walls) learning focus, the wall-blocking model (segment intersection, beam truncation, gaps), star adherence (0-miss-solvable), and SRL intent.
- `docs/agent/13-cosmetic-rewards.md`: the cosmetic reward layer (ship hulls, laser styles, themes), how items unlock (zone clears, XP, stars, badges), the Hangar, and the rule that cosmetics stay purely visual.
- `docs/agent/sources.md`: source notes and bibliography-style references.

Before adding or changing gameplay mechanics, level sequencing, scaffolds, feedback, adaptivity, stats, UI, audio, gamification, or multiplayer behavior, consult the relevant doc and keep the implementation aligned with that source-backed theory.

## Current Product

Slope Invaders teaches linear equations by letting students aim a cannon/ship with graphed equations. The player adjusts equation controls, watches or infers a trajectory on a coordinate plane, and fires through asteroid weak points.

Current user-facing flow:

1. The app opens on a tactical space-cockpit mode-select screen while retaining
   pixel-art game imagery and typography.
2. Campaign, endless Arcade, and (cloud-gated) live 1v1 Versus are available.
2a. Arcade is an endless full-grid `y = mx + b` survival mode implemented
separately under `src/game/arcade/`. Asteroids pause at five descending
vertices, can be intercepted mid-fall through swept collision, and damage one
of three shields only when they breach the bottom. Vertex hold starts at `5.0s`
and has a hard `2.75s` floor. Learners may enter immediately, but unfinished
Campaign progress triggers a recommendation notice. Private local records use
`slope-invaders:arcade-records-v1` and appear in Pilot Profile; Arcade awards no
Campaign XP, stars, badges, unlocks, or adaptive-tier data. See
`docs/agent/11-arcade-mode.md`.
3. Campaign opens a galaxy planet dial. Selecting a planet zooms to its surface
   map, where gold regions and faction banners launch levels directly. A "List
   view" toggle keeps the classic zone/level-list screens.
4. Tutorial opens with a one-time guided spotlight tour, then teaches slope, firing, grid reading, hearts, and feedback.
5. Zone 1 focuses on `y = mx`, slope-only reasoning, fractional slopes, sequential targets, no-preview mastery, and a final debrief.
5a. Zone 2 focuses on `y = mx + b`: the y-intercept lifts the line off the origin, same slope hits different targets at different `b`, and horizontal lines (`y = b`). Its no-preview mastery uses two-point lines so horizontal shortcuts cannot clear them. Horizontal "cheese" shots are intentionally allowed (no blockers yet).
5b. Zone 3 focuses on negative slopes in Quadrant IV: the ship sits at the top-left origin, positive x runs right, negative y runs down. It is slope-only (`y = mx`, y-intercept removed again so students can't bypass negative-slope reasoning), the slope starts flat at `m = 0`, a positive slope shoots up off the top, and only a negative slope reaches the asteroids. Its no-preview mastery uses two-point falling lines so the flat (`m = 0`) line cannot clear them.
5c. Zone 4 focuses on the full coordinate grid (all four quadrants, ship at the origin) with slope + y-intercept + a facing-direction control. The ship is a cannon: slope tilts the aim up (positive) or down (negative), and the facing buttons pick the side. Facing left mirrors the aim across the ship — facing right fires `y = m·x + b`, facing left fires its mirror `y = -m·x + b` — so a positive slope sends the shot up-and-left (Q2) and a negative slope down-and-left (Q3). The projectile always leaves the ship outward in the facing direction; the aim preview is bright forward and faded backward; the equation display and the dashed line show the effective (facing-mirrored) line while the slope stepper keeps the dialed value; the ship sprite flips with facing. A line is still infinite both ways but the shot fires one way. Every level has at least one asteroid per quadrant; later levels add more. Its end-of-zone quiz includes a True/False question that `y = mx + b` is an infinite line extending both directions.
5d. Zone 5 focuses on walls/shields: it keeps the Zone 4 controls (all quadrants, slope + y-intercept + facing) and adds `WallSpec` segments that block shots crossing them. A target can be hit by many equations, but a wall makes some invalid, so students choose a line that reaches the weak point without crossing a shield (flat/horizontal shots get blocked by a wall at the target's height). `hitDetection.isPathBlocked`/`firstWallHit` do segment intersection on the ship→target path (honoring `WallSpec.gaps`); the beam truncates at the first wall, the asteroid survives, and the blocked shot counts as a miss (so it costs a star). Every level keeps at least one clear line so 3 stars stays achievable. Walls are line segments of any orientation: most are vertical (blocking the flat/horizontal shot at a target's height), and some are **45° diagonal** shields (z5-l3, z5-l5) that block a sloped/diagonal fire so the student must change slope to go over or under. The geometry is locked by `zone5.test.ts`.
5e. Zones 6–9 extend the full-grid mechanics: Zone 6 is linked asteroids (chained rocks are all-or-none — one line must pass through every rock in the chain), Zone 7 adds friendly ships (a shot whose line crosses an ally is scrubbed and counts as a miss), Zone 8 is the moving cannon (the x-offset control slides the ship, teaching `y = m(x − h) + b`), and Zone 9 is the typed-equation capstone ("Equation Forge") which disables all standard nudges/steppers, locks trajectory previews off, and requires typing equations directly into slots (decimals, negatives, and fractions are supported).
5f. Winning a level shows the victory overlay with stars, an XP breakdown (one row per earned bonus with the reason it was earned, plus how much was banked), and any newly earned badges. XP uses best-run banking: only the improvement over that level's previous best run is added to the lifetime total, so replays reward improvement, never grinding, and XP never goes down. Lifetime XP maps to a pilot rank (Cadet → Pilot → Ace → Commander → Star Legend) that never demotes.
5g. The Pilot Profile is the private progress page: an astronaut pilot avatar,
rank/XP progress, badges, planet mastery, and a lifetime flight log. It opens
from the profile icon and returns to its originating screen. Keep it individual
— no comparisons, rankings, or other players.
5h. An optional, account-free **classroom cloud** (Phase 1) adds teacher
dashboards and student class-join, backed by Supabase. A Classroom entry on the
menu opens `ClassroomScreen` (enter a class code + name a cadet to join); the
teacher area (`TeacherDashboardScreen`) creates a class and shows a roster
dashboard (cadet, last active, levels, stars, XP/rank, accuracy, per-level
drill-down). It is additive: with no `VITE_SUPABASE_*` env vars
(`isCloudEnabled()` false) the whole game runs exactly as before, fully offline,
and a friendly notice replaces the cloud actions. No accounts — students are a
device UUID + cadet name; teachers hold an unguessable secret dashboard link
(`?teacher=<key>` opens it, `?class=<code>` prefills join). Progress sync is
best-effort and never affects scoring/adaptivity. See
`docs/agent/10-classroom-cloud.md` and `DEPLOYMENT.md`.
5i. **Live 1v1 Versus** (Phase 2, cloud-gated) is built. From the menu, Versus
opens `VersusLobbyScreen` (create a match or join a classmate's open match — only
same-class students appear, enforced by `0002_versus.sql`'s `join_match` atomic
update which also caps a match at 2 players). The duel (`VersusMatchScreen`,
driven by `useVersusMatch`) shows both boards live side by side: you control
yours, the opponent's is a read-only mirror updated over a Supabase Realtime
broadcast channel. Both derive the same asteroid field from the match's shared
`level_seed` (`src/game/versus/field.ts`). Players can adjust slope, y-intercept,
x-offset, and facing; persisted gameplay keybindings (A/D by default) move the
cannon horizontally, and the broadcast snapshot mirrors its moved position and
facing-adjusted line. It's a race — first to clear all
asteroids without losing all 5 hearts wins. `+2` (garbage asteroids) and `❄`
(freeze) attack pickups spawn on your grid; shooting one sends its effect to the
opponent. Both boards hide the trajectory preview so learners must calculate the
equation; the fired laser remains visible as feedback. Cloud-off or not-joined
users get a notice instead.
6. Settings controls music and SFX volume/mute, plus a "Change Controls" sub-screen (back button to the main settings, X always closes) for remapping the gameplay keyboard controls. There is no separate Audio button beside Play.
6a. Gameplay has remappable keyboard controls (defaults Space = fire, W/S = y-intercept ±, A/D = x-offset ∓/±, R/F = slope ±, Q/E = face left/right). Bindings persist in `slope-invaders:keybindings`, are gated by the level's allowed controls (Fire always works), and are ignored while a text input is focused or a shot is animating. Reassigning a key that another action owns prompts a confirm and leaves the old action unassigned; a one-click Restore Defaults resets all of them.
6b. App-wide keyboard accessibility: a skip-to-content link precedes every screen; modal dialogs (Settings, the controls reassign confirm, the shortcuts panel) trap focus and restore it on close (`useFocusTrap`); `?` toggles a shortcuts help panel anywhere; `S` opens Settings and `P` opens the Pilot Profile outside missions (never during gameplay, where letters are gameplay bindings); `:focus-visible` outlines mark the focused control. Screens are lazy-loaded (code splitting) with a "Loading…" status fallback; Konva, Supabase, and React land in separate chunks.
7. Menu music uses `src/assets/homescreen_background.mp3`.
8. Gameplay music uses `src/assets/in_game.mp3`.
9. SFX use `src/assets/laser.wav` and `src/assets/explosion.wav`.
10. Gameplay can return to the level/zone screens with the game bar navigation.

## Tech Stack

- Vite + React + TypeScript
- React 19
- Konva + React Konva for the coordinate-plane game board
- `expr-eval` for calculator expression parsing
- Plain CSS in `src/styles/global.css`
- Vitest for unit/app-shell/hook tests
- ESLint flat config

Use npm scripts:

```bash
npm run dev
npm test
npm run lint
npm run build
```

## Important Files

- `src/main.tsx` mounts the React app and imports global styles.
- `src/app/App.tsx` owns app-level screen state, mode/zone/level/game routing, settings modal state, music/SFX state, and adaptive tier wiring.
- `src/app/MenuScreen.tsx` renders the mode-select menu.
- `src/app/galaxy/` renders the galaxy planet dial and planet-surface
  region/banner map.
- `src/app/CampaignMapScreen.tsx` and `src/app/ZoneLevelsScreen.tsx` are the classic zone/level-list screens, kept as a "List view" fallback.
- `src/game/campaign/planets.ts` maps zones to planet sprites and computes safe,
  deterministic mission-banner paths.
- `src/app/DebriefScreen.tsx` renders end-of-zone reflection/debrief.
- `src/app/SettingsModal.tsx` renders music/SFX volume and mute controls and toggles to the controls sub-screen.
- `src/app/ControlsSettings.tsx` renders the keyboard remap sub-screen (two-column map, key capture, reassign confirm, restore defaults).
- `src/game/controls/keybindings.ts` defines the `GameAction` set, `DEFAULT_KEYBINDINGS`, and pure helpers (`findActionForKey`, `reassignKey`, `normalizeKey`, `keyLabel`, `withDefaults`); `Game.tsx` reads the bindings to drive a `keydown` handler.
- `src/app/useCampaignProgress.ts` owns localStorage progress, latest per-level stats, lifetime profile aggregates, XP banking, badge evaluation, unlock rules, and adaptive tier selection; `markComplete` returns `CompletionRewards`.
- `src/app/App.test.tsx` covers menu/settings/game shell behavior.
- `src/app/useCampaignProgress.test.tsx` covers progress/stats/adaptive-tier persistence behavior.
- `src/game/Game.tsx` owns live gameplay state: equation values, score, hearts, destroyed asteroids, shot animation, calculator toggle, feedback, reset/retry, the mission banner, and rich stats instrumentation.
- `src/game/arcade/` owns Arcade's separate pure simulation, swept moving-target
  collision, score/record rules, board, and runtime controller.
- `src/app/ArcadeBriefingScreen.tsx` explains Arcade rules and shows personal
  records before a run.
- `src/game/components/GuidedTour.tsx` renders the first-visit spotlight walkthrough used by levels that opt in; its steps walk every HUD element including the calculator and keyboard controls.
- `src/game/components/MissionBriefing.tsx` renders the one-time-per-level objective modal the player dismisses before playing.
- `src/game/audio/useMusic.ts` plays one looping background track and handles autoplay unlock.
- `src/game/audio/sfx.tsx` and `src/game/audio/sfxContext.ts` provide SFX playback.
- `src/game/audio/buttonClick.ts` provides delegated global button-click SFX and respects `data-button-sfx="none"` for buttons with their own sound.
- `src/game/campaign/difficulty.ts` defines `DifficultyTier`, `LevelStats`, scoring, tier selection (`selectTier` returns a structured `TierDecision`), and tier-based config transforms.
- `src/game/campaign/adaptivityTrace.ts` records tier-decision traces to a local ring buffer and builds the plain-language tier reasons (teacher-only transparency; `supabase/migrations/0003_dashboard_adaptivity.sql` exposes the synced tier info to the teacher dashboard).
- `src/app/useFocusTrap.ts`, `src/app/SkipLink.tsx`, and `src/app/KeyboardShortcutsHelp.tsx` provide app-wide keyboard accessibility (modal focus trapping, skip-to-content, and the `?` shortcuts panel).
- `src/game/campaign/levels/tutorial.ts` defines the Tutorial level.
- `src/game/campaign/levels/zone1.ts` defines Zone 1 and adaptive flags/variants.
- `src/game/campaign/levels/zone2.ts` defines Zone 2 (`y = mx + b`) and its adaptive flags/variants.
- `src/game/campaign/levels/zone3.ts` defines Zone 3 (negative slopes, Quadrant IV) and its adaptive flags/variants.
- `src/game/campaign/levels/zone4.ts` defines Zone 4 (full grid, all quadrants, facing direction) and its adaptive flags/variants.
- `src/game/campaign/levels/zone5.ts` defines Zone 5 (shields/walls) and its adaptive flags/variants; `src/game/logic/hitDetection.ts` (`segmentIntersection`, `isPathBlocked`, `firstWallHit`) implements wall blocking and `Game.tsx` truncates the beam + reports "Blocked!".
- `src/game/campaign/levels/zone6.ts`, `zone7.ts`, and `zone8.ts` define Zone 6 (linked asteroids), Zone 7 (friendly ships), and Zone 8 (moving cannon).
- `src/game/campaign/levels/helpers.ts` provides the `slopeLevel` (`y = mx`), `interceptLevel` (`y = mx + b`), `negativeSlopeLevel` (Quadrant IV, `y = mx`), and `fullGridLevel` (all quadrants, `y = mx + b` + direction) level-config factories.
- `src/game/campaign/xp.ts` computes per-run XP bonuses (`computeRunXp`), banks them against the level's best run (`bankXp`), and maps lifetime XP to pilot ranks (`rankForXp`); pure and unit-tested.
- `src/game/campaign/badges.ts` is the declarative badge registry (`BADGES`, concept/performance/growth) and `evaluateNewBadges`; pure and unit-tested. Concept badges carry a `zoneId` so the profile can use their unique planet art, while performance/growth badges carry a unique typed `iconKey` from `src/assets/achievements/`.
- `src/game/campaign/rewards.ts` defines `CompletionRewards` (XP award + new badges + new cosmetics), returned by `useCampaignProgress.markComplete` and rendered by `VictoryOverlay`.
- `src/game/campaign/cosmetics.ts` is the declarative cosmetic catalog (ship hulls, laser styles, themes) plus pure unlock helpers (`isUnlocked`, `evaluateNewUnlocks`, `describeUnlock`); unit-tested, framework-free, purely visual. `src/app/useLoadout.ts` owns the equipped selection; `src/app/HangarScreen.tsx` is the equip/browse UI. The board reads the equipped skin/laser/theme through `Game.tsx` → `GameBoard.tsx`/`Ship.tsx` (Konva HSV hue tinting); the theme also drives app-wide CSS variables from `App.tsx`.
- `src/game/campaign/profileStats.ts` holds the `ProfileStats` shape (game-layer so badges can read it; re-exported from `useCampaignProgress`).
- `src/app/PilotProfileScreen.tsx` renders the Pilot Profile (rank card, badge grid, planet mastery, flight log).
- `src/app/ClassroomScreen.tsx` (student class-join + cadet name) and `src/app/TeacherDashboardScreen.tsx` (teacher create + roster dashboard) are the cloud-gated classroom screens; both show an offline notice when `isCloudEnabled()` is false.
- `src/cloud/` is the classroom cloud layer: `supabaseClient.ts` (lazy client + `isCloudEnabled()`), `identity.ts` (device student id, cadet name, joined-class + teacher-class records), `classroom.ts` (RPC wrappers; `pushProgress` best-effort/silent), `progressPayload.ts` (pure `buildProgressPayload` snapshot → `{summary, levels}`). `useCampaignProgress` debounce-syncs on change and exposes `syncNow()` for post-join backfill.
- `supabase/migrations/0001_classroom.sql` is the Postgres schema (`classrooms`/`students`/`level_results`), RLS default-deny, and the four `SECURITY DEFINER` RPCs gated on unguessable codes. `.env.example` + `DEPLOYMENT.md` cover setup.
- `src/app/VersusLobbyScreen.tsx` (create/join a match) and `src/app/VersusMatchScreen.tsx` (the live dual-board duel) are the cloud-gated Versus screens; `App` routes `versus` and `versus-match`.
- `src/cloud/versus.ts` is the matchmaking RPC wrappers (`create_match`/`list_open_matches`/`join_match`/`get_match`/`cancel_match`/`finish_match`) + `openMatchChannel()` (Supabase Realtime broadcast). `src/game/versus/` holds the pure deterministic field/items (`field.ts`), the protocol types (`types.ts`), and the `useVersusMatch` controller (board state, realtime sync, item economy, win/lose).
- `supabase/migrations/0002_versus.sql` adds the `matches` table + matchmaking RPCs (atomic `join_match` enforces the 2-player cap + same class); run it after `0001`.
- `vitest.setup.ts` shims konva's optional native `canvas` dependency (Node build) so the jsdom component tests run without it; wired via `vitest.config.ts` `setupFiles`.
- The `direction`/`facing` control mechanic: `Game.tsx` derives the effective fired line (`fireM = facing === 'right' ? m : -m`, `fireB` through the ship) and feeds it to hit detection, the board, and the equation; it also orients the shot segment to start at the ship so the projectile flies outward. `hitDetection.ts` and `coordinateTransform.ts` take a `facing` param (right reaches `x ≥ fromX`, left reaches `x ≤ fromX`). `EquationLine.tsx` draws the two-tone preview, `EquationControls.tsx` the toggle (and shows the facing-mirrored slope in the equation), and `Ship.tsx` flips the sprite.
- `src/game/campaign/zones.ts` is the campaign zone registry and navigation helper source.
- `src/game/levels/types.ts` defines the reusable level model and campaign-mode optional fields.
- `src/game/components/Calculator.tsx`, `src/game/components/calc.ts`, and `src/game/components/calculatorPosition.ts` implement the floating calculator, safe evaluator, draggable placement, and persisted viewport-safe positioning.
- `src/game/components/` contains Konva canvas components and DOM controls.
- `src/game/logic/` contains pure math, scoring, hit detection, and feedback logic with tests.
- `src/assets/assetMap.ts` is the source of truth for sprite/icon/heart/planet,
  audio, and typed tactical UI imports.
- `src/assets/ui/` contains only the curated optimized production derivatives.
- `src/game/components/TacticalButton.tsx`, `TacticalPanel.tsx`, and
  `CoachPanel.tsx` are the reusable tactical shell primitives.
- `docs/ASSET_SOURCES.md` records tactical asset provenance and usage rules.
- `scripts/pixelize_ui_assets.py` creates non-destructive, category-aware
  pixelized previews under `tmp/pixelized-ui/`; CSS alone does not convert
  smooth source artwork into pixel art.
- `src/styles/global.css` contains all app styling.

## Architecture Notes

Keep rendering, game state, level data, progress, and pure math separate.

- App shell, routing, progress, and settings belong in `src/app/`.
- Gameplay screen state belongs in `src/game/Game.tsx`.
- Campaign sequencing and pedagogy live in `src/game/campaign/`.
- Reusable gameplay UI belongs in `src/game/components/`.
- Math and hit/scoring rules belong in `src/game/logic/` and should stay framework-free.
- Asset imports belong in `src/assets/assetMap.ts`.

The campaign model is intentionally future-ready. Add zones/levels through `src/game/campaign/zones.ts` and `src/game/campaign/levels/*`, and keep the teaching progression aligned with `docs/agent/01-learning-design.md` and `docs/agent/05-prototype-scope-zone-1.md`.

Tutorial and every current zone must keep a unique planet assignment in
`campaign/planets.ts`, ordered to become more visually dramatic as the campaign
advances. Badge emblems must also remain unique.

## Adaptive Difficulty and Stats

- Each zone's first level is a fixed `standard` diagnostic; later levels in that zone set `adaptive: true`.
- `progress.tierForLevel(zone, index)` chooses support/standard/challenge from prior same-zone level stats, so adaptivity rolls per zone (Zone 2 tiers ignore Zone 1 performance). It returns a full `TierDecision` (tier + EMA + weights + thresholds); use `.tier` for gameplay.
- `configForTier(level, tier)` applies hearts/scaffold deltas and challenge variants.
- Do not render a visible difficulty badge; adaptivity should be invisible and non-stigmatizing **to students**. Adaptivity transparency is teacher-only: each tier decision is traced locally (`slope-invaders:adaptivity-trace`, ring buffer, cleared on progress reset), the cloud sync embeds each level's resolved tier + plain-language reason in its stats payload, and the teacher dashboard drill-down shows it as a tier chip (migration `0003_dashboard_adaptivity.sql` exposes it). Never render tiers, EMAs, or reasons in any student-facing screen (Pilot Profile included).
- `LevelStats` captures rich per-level visit data (including `firstShotHit` and the resolved `trajectoryPreview` mode — both optional so legacy stored stats stay valid).
- `markComplete(levelId, stats)` returns `CompletionRewards` (the banked XP award + newly earned badges) so the victory overlay can announce them.
- `slope-invaders:level-stats` stores the latest stats per level.
- `slope-invaders:profile-stats` accumulates lifetime totals per completion, including replays.
- `slope-invaders:xp` stores `{ totalXp, levelBestXp }` — the lifetime XP total and each level's best single-run XP (the best-run-banking baseline). Never subtract from it.
- `slope-invaders:badges` stores earned badges (badge id → epoch ms). Badges are never revoked.
- `slope-invaders:unlocks` stores earned cosmetics (item id → epoch ms); never revoked. The set is evaluated post-completion in `markComplete` (and backfilled in the `useCampaignProgress` initializer + on Arcade XP gains) against the `cosmetics.ts` unlock rules. `slope-invaders:loadout` stores the equipped ship/laser/theme ids (`useLoadout`, validated against the catalog with defaults as fallback).
- XP, badges, and cosmetics must never be keyed on calculator opens, tweak counts, or speed.
- `slope-invaders:student-id` is the account-free per-device UUID (the cloud `students` row key); `slope-invaders:cadet-name` is the chosen display name; `slope-invaders:classroom` is the joined class record; `slope-invaders:teacher-keys` remembers classes this device created (with their secret teacher keys). These power the optional classroom cloud and stay empty/unused when cloud is off.
- `slope-invaders:calculator-position` stores the calculator's last dropped viewport position; restore it clamped to the current viewport so it cannot reopen off-screen.
- `slope-invaders:keybindings` stores the gameplay key map (merge over `DEFAULT_KEYBINDINGS` on read so a stored map that predates a new action stays valid).
- `slope-invaders:tour-seen:{levelId}` and `slope-invaders:briefing-seen:{levelId}` record whether a level's first-open guided tour / Mission Briefing has been shown, so each appears only once per level.
- `slope-invaders:arcade-records-v1` stores private Arcade personal bests and
  lifetime Arcade totals. Do not mix it into Campaign or classroom progress.
- `slope-invaders:adaptivity-trace` stores the local ring buffer of tier-decision traces (teacher/support observability only; never student-facing).
- Calculator opens and tweaks are recorded but not scored.

## Guided Tour and Mission Banner

- The learning goal renders in a full-width mission banner (with an "Objective" eyebrow and a brief one-time entrance highlight) above the board; the old per-level teaching "callout" banner has been removed.
- On a level's first open the objective is also surfaced in a one-time **Mission Briefing** modal (`MissionBriefing`) the player must dismiss with "Begin Mission" before playing, so the instructions are read rather than ignored. It is suppressed on guided-tour levels (e.g. the Tutorial), whose tour already covers the objective, and its seen-state persists per level alongside the tour.
- A level can opt into a one-time spotlight walkthrough that runs on first open (the Tutorial uses it). The walkthrough explicitly covers the calculator and keyboard controls in addition to the grid, mission, hearts, stats, and feedback. See `GuidedTour` and `Game.tsx` for how steps and targets are wired.
- Gameplay control buttons print their keyboard shortcut as a small `<kbd>` chip (driven by the current key map, so remaps are reflected). The chips are shown only on fine-pointer/hover devices so touch users do not see meaningless key hints; they never appear in the typed-equation entry mode (Zone 9 has no steppers).

## UI and Design Guidance

- Use the shooter-kit tactical cockpit as the primary shell around the existing
  8-bit game world.
- Keep math readability above visual spectacle; the graph must remain the
  highest-contrast gameplay surface.
- Use the robot only as instructional Mission Control, never as the player.
- Keep labels and dynamic values as accessible HTML rather than baked-in artwork.
- Add curated assets through typed collections in `assetMap.ts`; do not commit
  the original 1.18 GB source packs.
- Keep the shared 3D press treatment and generic click SFX on buttons; opt out only for buttons with their own dedicated sound, such as the actual Fire button using laser SFX.
- Keep Settings as the single menu entry point for audio controls.
- Avoid adding marketing/landing-page sections; the first screen should remain the actual game/mode experience.
- Maintain responsive behavior. Check desktop and a narrow mobile viewport after visible UI changes.
- Avoid text overflow with the pixel font. Prefer shorter labels and stable button dimensions.
- For gameplay, keep controls and feedback close enough to the graph to reduce cognitive load.

## Testing Expectations

Before handing off changes, run:

```bash
npm test
npm run lint
npm run build
```

For rendered UI changes, also run the dev server and verify the browser flow:

```bash
npm run dev -- --host 127.0.0.1
```

Minimum UI smoke flow:

1. Mode-select menu loads.
2. Campaign opens the galaxy planet dial; selecting a planet opens its surface
   and an unlocked faction banner launches its mission.
3. Tutorial/Zone navigation works according to unlock rules (galaxy and the "List view" fallback).
4. Top-right Settings opens music/SFX controls.
5. A playable level opens and shows graph, hearts, equation controls, feedback, and game bar.
6. Calculator opens, computes `(6-2)/(3-1) = 2`, closes, and leaves the board visible.
7. Winning a level shows stars plus the XP breakdown (and a badge announcement when one is earned); the galaxy header XP pill updates.
8. The main menu's profile icon opens the Pilot Profile (rank card, badges,
   planet mastery, flight log) and its back button returns to the menu.
9. Mobile/narrow viewport has no horizontal overflow.
10. Console has no relevant errors.

## Git Hygiene

Commit source, config, lockfile, assets, tests, docs, and agent instruction files.

Do not commit:

- `node_modules/`
- `dist/`
- coverage and test caches
- local `.env*` secrets
- local editor/OS clutter
- `.claude/settings.local.json` or other `.claude/*.local.json`

## Implementation Preferences

- Prefer small, focused changes that follow existing file boundaries.
- Use `rg` for code search.
- Add or update tests before changing behavior when practical.
- Do not revert unrelated user or generated changes.
- Do not replace existing asset imports with hardcoded URLs.
- Keep comments useful and sparse.
- If adding dependencies, make sure they are justified for a prototype and reflected in `package-lock.json`.
- If a change affects future-agent understanding, update the agent docs immediately.
