# Slope Invaders Agent Guide

This file is for OpenAI Codex and other agentic coding tools. Claude-specific tools can also read `.claude/CLAUDE.md`; the project guidance is intentionally the same in spirit across files.

## Project Snapshot

Slope Invaders is a Vite + React + TypeScript educational game. It teaches linear equations by letting students aim a ship/cannon with `y = mx + b` and fire at asteroid weak points on a coordinate plane.

Current flow:

- App starts on a pixel-art arcade menu.
- Top-right Settings is the only menu entry point for music controls.
- Play Level 1 launches the only playable level.
- Level Select already shows future disabled levels.
- Menu music: `src/assets/homescreen_background.mp3`.
- Gameplay music: `src/assets/in_game.mp3`.

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

- `src/app/App.tsx`: app shell, menu/game routing, settings state, music state.
- `src/app/MenuScreen.tsx`: main menu and level select.
- `src/app/SettingsModal.tsx`: volume and mute controls.
- `src/game/Game.tsx`: gameplay state machine.
- `src/game/audio/useMusic.ts`: background music hook.
- `src/game/levels/index.ts`: level registry for menu/level select.
- `src/game/levels/levelOne.ts`: current playable level.
- `src/game/components/`: Konva board and DOM gameplay UI.
- `src/game/logic/`: pure, tested math/game logic.
- `src/assets/assetMap.ts`: source of truth for sprite/icon/audio imports.
- `src/styles/global.css`: global styling.

## Working Rules

- Keep app-shell work in `src/app/`; keep gameplay work in `src/game/`.
- Keep pure math and hit/scoring logic framework-free and covered by tests.
- Preserve the existing pixel-art arcade style and use available assets first.
- Keep Settings as the only menu audio-control entry point.
- Do not commit `node_modules/`, `dist/`, caches, local secrets, or local Claude settings.
- Run `npm test`, `npm run lint`, and `npm run build` before claiming completion.
- For visual UI work, also verify the rendered app in a browser at desktop and mobile widths.
