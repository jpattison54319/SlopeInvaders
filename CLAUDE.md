# Slope Invaders Claude Guide

Claude agents should read `.claude/CLAUDE.md` for the detailed project guide. This root file exists because some agent tools only scan repository-root instruction files.

Quick orientation:

- This is **Slope Invaders**, a Vite + React + TypeScript + React Konva educational math game.
- The repo folder is `SlopeBlasters`, but the game title is `Slope Invaders`.
- Campaign is the playable mode today; Arcade and Versus are coming soon.
- Campaign opens an atmospheric galaxy where zones are planets on a rotating dial and the active planet's "hotspots" are its levels (a "List view" toggle keeps the classic zone/level screens). Planet art is in `src/assets/planets/`.
- `src/app/` contains app shell, mode/zone routing, settings, progress, stats, and adaptive tier wiring.
- `src/game/` contains gameplay, campaign data, components, audio, and pure game logic.
- Zones 1–4 are playable; each uses invisible rolling adaptive difficulty after its own first diagnostic level. Zone 1 is `y = mx`; Zone 2 adds the y-intercept (`y = mx + b`, half-step `b`, horizontal lines); Zone 3 is negative slopes in Quadrant IV (ship at top-left, slope-only with the y-intercept removed again so the lesson can't be bypassed); Zone 4 is the full grid / all four quadrants with slope + y-intercept + a facing-direction control. The coordinate plane renders any-quadrant bounds.
- A line is infinite both ways but a shot fires one way: in Zone 4 the ship is a cannon — slope tilts the aim up/down and the facing control (left/right) picks the side. Facing left mirrors the aim across the ship (right fires `y = mx + b`, left fires `y = -mx + b`), the projectile always leaves the ship outward, the preview is bright forward / faded backward, and the equation + dashed line show the facing-mirrored line while the slope stepper keeps the dialed value.
- The in-level calculator is a free tool and must not penalize scoring/adaptivity; its dragged viewport position persists in `slope-invaders:calculator-position`.
- The learning goal sits in a full-width mission banner above the board (the old per-level teaching "callout" is gone).
- Levels can opt into a one-time guided spotlight tour on first open; the Tutorial uses it.
- Buttons use a shared 3D press treatment and generic click SFX; the actual Fire button opts out because it plays the laser SFX.
- Audio settings are opened from the top-right Settings button. Settings also has a "Change Controls" sub-screen for remapping the gameplay keyboard controls.
- Gameplay has keyboard controls that drive the equation/facing/fire (defaults Space fire, W/S y-intercept ±, A/D x-offset ∓/±, R/F slope ±, Q/E face left/right). Bindings are remappable and persisted (`slope-invaders:keybindings`); each key is gated by the level's allowed controls (Fire always works) and ignored while typing or while a shot animates.
- `docs/agent/` contains the foundational source-backed theory for game, pedagogy, adaptivity, UI/audio, and Zone 1 decisions. Consult it before changing design behavior.
- Always update `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, and relevant `docs/agent/` files whenever project architecture, flows, rules, dependencies, or design theory change.
- Run `npm test`, `npm run lint`, and `npm run build` before handoff.

See `.claude/CLAUDE.md` for full architecture, testing, docs, and git-hygiene details.
