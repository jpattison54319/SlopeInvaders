# Slope Invaders Claude Guide

Claude agents should read `.claude/CLAUDE.md` for the detailed project guide. This root file exists because some agent tools only scan repository-root instruction files.

Quick orientation:

- This is **Slope Invaders**, a Vite + React + TypeScript + React Konva educational math game.
- The repo folder is `SlopeBlasters`, but the game title is `Slope Invaders`.
- Campaign is the playable mode today; Arcade and Versus are coming soon.
- `src/app/` contains app shell, mode/zone routing, settings, progress, stats, and adaptive tier wiring.
- `src/game/` contains gameplay, campaign data, components, audio, and pure game logic.
- Zone 1 uses invisible rolling adaptive difficulty after its first diagnostic level.
- The in-level calculator is a free tool and must not penalize scoring/adaptivity; its dragged viewport position persists in `slope-invaders:calculator-position`.
- Buttons use a shared 3D press treatment and generic click SFX; the actual Fire button opts out because it plays the laser SFX.
- Audio settings are opened from the top-right Settings button.
- `docs/agent/` contains the foundational source-backed theory for game, pedagogy, adaptivity, UI/audio, and Zone 1 decisions. Consult it before changing design behavior.
- Always update `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, and relevant `docs/agent/` files whenever project architecture, flows, rules, dependencies, or design theory change.
- Run `npm test`, `npm run lint`, and `npm run build` before handoff.

See `.claude/CLAUDE.md` for full architecture, testing, docs, and git-hygiene details.
