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
- `docs/agent/sources.md`: bibliography-style source notes.

Before adding or changing gameplay, pedagogy, UI, audio, feedback, adaptivity, gamification, or multiplayer behavior, consult the relevant `docs/agent` file and keep the implementation rooted in that source-backed design theory.

## Project Snapshot

Slope Invaders is a Vite + React + TypeScript educational game. It teaches linear equations by letting students aim a ship/cannon with graphed equations and fire at asteroid weak points on a coordinate plane.

Current product flow:

- App starts on a pixel-art arcade mode-select menu.
- Campaign is the available mode; Arcade and Versus are coming soon.
- Campaign map shows Tutorial unlocked, Zone 1 unlocked after Tutorial, and later zones locked/coming soon.
- Tutorial and Zone 1 levels use hearts, feedback, trajectory preview/scaffold settings, and reflections/debriefs.
- Zone 1 uses rolling adaptive difficulty after its first diagnostic level.
- In-level calculator opens from the game bar and is a free tool for stats/adaptivity.
- Top-right Settings controls music and SFX volume/mute.
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
- `src/app/CampaignMapScreen.tsx`: campaign zone map.
- `src/app/ZoneLevelsScreen.tsx`: level select inside a zone.
- `src/app/DebriefScreen.tsx`: end-of-zone reflection/debrief.
- `src/app/SettingsModal.tsx`: music and SFX controls.
- `src/app/useCampaignProgress.ts`: localStorage progress, rich stats, profile aggregate, unlock rules, adaptive tier selection.
- `src/game/Game.tsx`: gameplay state machine, hearts/losses, calculator toggle, stats instrumentation.
- `src/game/audio/buttonClick.ts`: delegated global button-click SFX; respect `data-button-sfx="none"` for buttons with their own sound.
- `src/game/campaign/difficulty.ts`: adaptive tiers, `LevelStats`, scoring, tier config transforms.
- `src/game/campaign/levels/tutorial.ts`: Tutorial campaign level.
- `src/game/campaign/levels/zone1.ts`: Zone 1 levels and adaptive flags/variants.
- `src/game/campaign/zones.ts`: zone registry and navigation helpers.
- `src/game/components/Calculator.tsx`, `src/game/components/calc.ts`, and `src/game/components/calculatorPosition.ts`: in-level calculator, safe expression evaluation, draggable placement, and persisted viewport-safe positioning.
- `src/game/components/`: Konva board and DOM gameplay UI.
- `src/game/logic/`: pure, tested math/game logic.
- `src/assets/assetMap.ts`: source of truth for sprite/icon/audio imports.
- `src/styles/global.css`: global styling.

## Working Rules

- Keep app-shell work in `src/app/`; keep gameplay work in `src/game/`.
- Keep pure math and hit/scoring logic framework-free and covered by tests.
- Keep campaign pedagogy and sequencing consistent with `docs/agent/`.
- Preserve the pixel-art arcade style while keeping the graph and math readable.
- Use available assets first; do not replace asset-map imports with hardcoded URLs.
- Keep Settings as the only menu audio-control entry point.
- Do not display adaptive tier labels to learners; adaptation should be invisible/non-stigmatizing.
- The calculator is a free tool: record opens, but never penalize scoring/adaptivity for it.
- The calculator position is stored in `slope-invaders:calculator-position`; clamp restored positions to the current viewport so it cannot reopen off-screen.
- Buttons should keep the shared 3D press feel and generic click SFX; the actual Fire button opts out because it plays the laser SFX.
- Do not commit `node_modules/`, `dist/`, caches, local secrets, or local Claude settings.
- Run `npm test`, `npm run lint`, and `npm run build` before claiming completion.
- For visible UI work, also verify the rendered app in a browser at desktop and mobile widths.
