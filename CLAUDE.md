# Slope Invaders Claude Guide

Claude agents should use `.claude/CLAUDE.md` as the detailed project guide. This top-level file exists because some agent tools only scan repository-root instruction files.

Quick orientation:

- This is **Slope Invaders**, a Vite + React + TypeScript + React Konva educational math game.
- The repo folder is `SlopeBlasters`, but the game title is `Slope Invaders`.
- `src/app/` contains the menu/settings/app shell.
- `src/game/` contains gameplay, levels, components, audio, and pure game logic.
- The menu has Play Level 1 and Level Select. Audio settings are opened only from the top-right Settings button.
- Run `npm test`, `npm run lint`, and `npm run build` before handoff.

See `.claude/CLAUDE.md` for full architecture, testing, and git-hygiene details.
