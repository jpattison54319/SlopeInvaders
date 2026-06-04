# Slope Invaders Agent Guide

This repository contains **Slope Invaders**, a browser-based educational math game built as a greenfield prototype. The repo folder is named `SlopeBlasters`, but the game title and UI copy use **Slope Invaders**.

Use this guide for Claude Code, OpenAI Codex, and other coding agents. The same project guidance is mirrored from the top-level `AGENTS.md`/`CLAUDE.md` files so agents that do not read `.claude/` still get oriented.

## Current Product

Slope Invaders teaches linear equations by letting students aim a cannon/ship with `y = mx + b`. The player adjusts slope `m` and y-intercept `b`, watches the dashed line on a coordinate plane, and fires through asteroid weak points.

Current user-facing flow:

1. The app opens on a pixel-art arcade menu.
2. The menu shows a top-right Settings button, a Play Level 1 button, and a future-proof level select grid.
3. Only Level 1 is playable. Future levels are visible as coming-soon entries.
4. Settings controls music volume and mute state. There is no separate Audio button beside Play.
5. Menu music uses `src/assets/homescreen_background.mp3`.
6. Gameplay music uses `src/assets/in_game.mp3`.
7. Gameplay can return to the menu with the Menu button in the game bar.

## Tech Stack

- Vite + React + TypeScript
- React 19
- Konva + React Konva for the coordinate-plane game board
- Plain CSS in `src/styles/global.css`
- Vitest for unit and app-shell tests
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
- `src/app/App.tsx` owns app-level screen state, selected level, settings modal state, and music volume/mute state.
- `src/app/MenuScreen.tsx` renders the arcade main menu and level select.
- `src/app/SettingsModal.tsx` renders music volume/mute controls.
- `src/app/App.test.tsx` covers menu rendering, settings behavior, and menu/game music switching.
- `src/game/Game.tsx` owns live gameplay state: equation values, score, destroyed asteroids, shot animation, feedback, reset, and back/settings callbacks.
- `src/game/audio/useMusic.ts` plays one looping background track and handles autoplay unlock after user interaction.
- `src/game/levels/index.ts` is the level registry used by the menu.
- `src/game/levels/levelOne.ts` is the only playable level today.
- `src/game/levels/types.ts` defines the future-ready level model.
- `src/game/components/` contains Konva canvas components and DOM controls.
- `src/game/logic/` contains pure math, scoring, hit detection, and feedback logic with tests.
- `src/assets/assetMap.ts` is the source of truth for sprite/icon/audio imports.
- `src/styles/global.css` contains all app styling.

## Architecture Notes

Keep rendering, game state, level data, and pure math separate.

- App shell concerns belong in `src/app/`.
- Gameplay screen state belongs in `src/game/Game.tsx`.
- Reusable gameplay UI belongs in `src/game/components/`.
- Math and hit/scoring rules belong in `src/game/logic/` and should stay framework-free.
- Level definitions belong in `src/game/levels/`.
- Asset imports belong in `src/assets/assetMap.ts`.

The level registry is intentionally future-proof. Add a level by adding a `LevelEntry` in `src/game/levels/index.ts`; make it playable by setting `status: 'available'` and providing a real `LevelConfig`.

## UI and Design Guidance

- Preserve the 8-bit arcade space vibe.
- Use existing sliced UI icon assets before adding new art.
- Keep Settings as the single menu entry point for audio controls.
- Keep the level-select grid future-proof: Level 1 playable, later levels visible but disabled until configured.
- Avoid adding marketing/landing-page sections; the first screen is the actual game menu.
- Maintain responsive behavior. Check desktop and a narrow mobile viewport after visible UI changes.
- Avoid text overflow with the pixel font. Prefer shorter labels and stable button dimensions.

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

1. Menu loads with Play Level 1 and Level Select.
2. No standalone Audio button appears next to Play.
3. Top-right Settings opens the music controls.
4. Volume slider and mute toggle update state.
5. Play Level 1 opens gameplay.
6. Game Menu button returns to the menu.
7. Console has no relevant errors.

## Git Hygiene

Commit source, config, lockfile, assets, tests, and agent instruction docs.

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
