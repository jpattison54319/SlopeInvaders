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
- `docs/agent/sources.md`: source notes and bibliography-style references.

Before adding or changing gameplay mechanics, level sequencing, scaffolds, feedback, adaptivity, stats, UI, audio, gamification, or multiplayer behavior, consult the relevant doc and keep the implementation aligned with that source-backed theory.

## Current Product

Slope Invaders teaches linear equations by letting students aim a cannon/ship with graphed equations. The player adjusts equation controls, watches or infers a trajectory on a coordinate plane, and fires through asteroid weak points.

Current user-facing flow:

1. The app opens on a pixel-art mode-select menu.
2. Campaign is available; Arcade and Versus are visible as coming-soon modes.
3. Campaign map shows Tutorial first, then Zone 1 after Tutorial is cleared.
4. Tutorial opens with a one-time guided spotlight tour, then teaches slope, firing, grid reading, hearts, and feedback.
5. Zone 1 focuses on `y = mx`, slope-only reasoning, fractional slopes, sequential targets, no-preview mastery, and a final debrief.
6. Settings controls music and SFX volume/mute. There is no separate Audio button beside Play.
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
- `src/app/CampaignMapScreen.tsx` renders the campaign zone map.
- `src/app/ZoneLevelsScreen.tsx` renders level select within a zone.
- `src/app/DebriefScreen.tsx` renders end-of-zone reflection/debrief.
- `src/app/SettingsModal.tsx` renders music/SFX volume and mute controls.
- `src/app/useCampaignProgress.ts` owns localStorage progress, latest per-level stats, lifetime profile aggregates, unlock rules, and adaptive tier selection.
- `src/app/App.test.tsx` covers menu/settings/game shell behavior.
- `src/app/useCampaignProgress.test.tsx` covers progress/stats/adaptive-tier persistence behavior.
- `src/game/Game.tsx` owns live gameplay state: equation values, score, hearts, destroyed asteroids, shot animation, calculator toggle, feedback, reset/retry, the mission banner, and rich stats instrumentation.
- `src/game/components/GuidedTour.tsx` renders the first-visit spotlight walkthrough used by levels that opt in.
- `src/game/audio/useMusic.ts` plays one looping background track and handles autoplay unlock.
- `src/game/audio/sfx.tsx` and `src/game/audio/sfxContext.ts` provide SFX playback.
- `src/game/audio/buttonClick.ts` provides delegated global button-click SFX and respects `data-button-sfx="none"` for buttons with their own sound.
- `src/game/campaign/difficulty.ts` defines `DifficultyTier`, `LevelStats`, scoring, tier selection, and tier-based config transforms.
- `src/game/campaign/levels/tutorial.ts` defines the Tutorial level.
- `src/game/campaign/levels/zone1.ts` defines Zone 1 and adaptive flags/variants.
- `src/game/campaign/zones.ts` is the campaign zone registry and navigation helper source.
- `src/game/levels/types.ts` defines the reusable level model and campaign-mode optional fields.
- `src/game/components/Calculator.tsx`, `src/game/components/calc.ts`, and `src/game/components/calculatorPosition.ts` implement the floating calculator, safe evaluator, draggable placement, and persisted viewport-safe positioning.
- `src/game/components/` contains Konva canvas components and DOM controls.
- `src/game/logic/` contains pure math, scoring, hit detection, and feedback logic with tests.
- `src/assets/assetMap.ts` is the source of truth for sprite/icon/heart/audio imports.
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

## Adaptive Difficulty and Stats

- Zone 1 level 1 is a fixed `standard` diagnostic.
- Later Zone 1 levels set `adaptive: true`.
- `progress.tierForLevel(zone, index)` chooses support/standard/challenge from prior same-zone level stats.
- `configForTier(level, tier)` applies hearts/scaffold deltas and challenge variants.
- Do not render a visible difficulty badge; adaptivity should be invisible and non-stigmatizing.
- `LevelStats` captures rich per-level visit data for future profile work.
- `slope-invaders:level-stats` stores the latest stats per level.
- `slope-invaders:profile-stats` accumulates lifetime totals per completion, including replays.
- `slope-invaders:calculator-position` stores the calculator's last dropped viewport position; restore it clamped to the current viewport so it cannot reopen off-screen.
- Calculator opens and tweaks are recorded but not scored.

## Guided Tour and Mission Banner

- The learning goal renders in a full-width mission banner above the board; the old per-level teaching "callout" banner has been removed.
- A level can opt into a one-time spotlight walkthrough that runs on first open (the Tutorial uses it). See `GuidedTour` and `Game.tsx` for how steps and targets are wired.

## UI and Design Guidance

- Preserve the 8-bit arcade space vibe.
- Keep math readability above visual spectacle.
- Use existing sliced UI/audio assets before adding new art.
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
2. Campaign opens the campaign map.
3. Tutorial/Zone level navigation works according to unlock rules.
4. Top-right Settings opens music/SFX controls.
5. A playable level opens and shows graph, hearts, equation controls, feedback, and game bar.
6. Calculator opens, computes `(6-2)/(3-1) = 2`, closes, and leaves the board visible.
7. Mobile/narrow viewport has no horizontal overflow.
8. Console has no relevant errors.

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
