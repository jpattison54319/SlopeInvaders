# Slope Invaders

An educational, browser-based 2D graphing game. Students aim an equation-powered
cannon at asteroids on a coordinate plane by adjusting the **slope (m)** and
**y-intercept (b)** of a line `y = mx + b`. It teaches slope, intercepts,
quadrants, and (in future levels) negative slopes and multi-point targeting.

> The repository folder is `SlopeBlasters`; the game is titled **Slope Invaders**.

## Quick start

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run the math/game-logic unit tests (Vitest)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## How to play

1. The cannon sits at the origin of a Quadrant‑I grid; three asteroids wait at
   clean integer coordinates.
2. Adjust **m** (slope) and **b** (y‑intercept) with the number inputs or the
   `+ / −` buttons. Slope accepts fractions like `0.5`, `2`, `-1`.
3. The dashed amber line previews `y = mx + b`. Line it up with an asteroid's
   glowing weak point.
4. Press **Fire**. A bolt travels along the line; any asteroid whose weak point
   the line passes through is destroyed.
5. Read the feedback panel — it explains *why* you hit or missed, e.g.
   *"At x = 6, your line was at y = 6, but the asteroid was at y = 3. Try
   decreasing the slope or the y‑intercept."*
6. Clear all three asteroids to complete the level. **Reset Level** restarts it.

## Tech stack

- **Vite** + **React** + **TypeScript**
- **React Konva** (`konva` + `react-konva`) for the 2D canvas board
- **expr-eval** for the in-level calculator's expression parsing
- Plain CSS (`src/styles/global.css`)
- **Vitest** for the core math/game-logic tests

## Architecture

Rendering, math, and level data are deliberately separated:

```
src/
  app/App.tsx                  # app shell: mode/zone/level/game router + music + SFX + settings
  app/MenuScreen.tsx           # landing: game-mode select (Campaign + coming-soon modes)
  app/CampaignMapScreen.tsx    # zone map (sequential unlock)
  app/ZoneLevelsScreen.tsx     # level select within a zone
  app/DebriefScreen.tsx        # end-of-zone reflection (MC + open-ended prompts)
  app/ScreenChrome.tsx         # shared starfield page wrapper + top bar
  app/SettingsModal.tsx        # music + sound-FX volume / mute controls
  app/useCampaignProgress.ts   # localStorage progress + unlock rules
  app/usePersistentState.ts    # tiny localStorage-backed useState
  game/
    Game.tsx                   # gameplay: equation, fire animation, hearts/lose, scoring, advance
    audio/useMusic.ts          # menu/game background music hook
    audio/sfx.tsx              # SfxProvider; audio/sfxContext.ts # useSfx hook (laser/explosion)
    modes/                     # GameMode registry (campaign available; arcade/versus coming soon)
    campaign/                  # zones + levels (tutorial, zone1) + nav helpers (nextLevel, …)
      difficulty.ts            #   rolling adaptive tiers + LevelStats + scorePerformance
    components/                # React Konva + DOM UI
      GameBoard.tsx            #   Stage/Layer: board + beam + preview/coords/active-target toggles
      Grid.tsx  Axes.tsx       #   coordinate plane (Axes: showLabels toggle)
      EquationLine.tsx         #   preview line (always / after-fire / off, normal / dimmed)
      Asteroid.tsx Ship.tsx    #   sprites & pixel-art placeholders (Asteroid: coords + active)
      Wall.tsx                 #   wall/shield placeholder (future)
      Explosion.tsx            #   self-animating hit burst
      Hud.tsx                  #   score / progress / hearts / feedback panel
      EquationControls.tsx     #   slope / intercept / x-offset steppers, Fire / Reset
      Callout.tsx              #   teaching banner
      Calculator.tsx calc.ts   #   floating in-level calculator (+ expr-eval helper)
      ReflectionQuestionCard.tsx #  inline multiple-choice reflection
      IconButton.tsx Modal.tsx useImage.ts colors.ts  # helpers
    logic/                     # pure, unit-tested — no React/Konva
      lineMath.ts              #   getYAtX, isPointOnLine, getMissDistance,
                               #   calculateSlopeBetweenPoints, calculateInterceptFromPoint
      coordinateTransform.ts   #   graphToScreen, screenToGraph, lineBoardSegment
      hitDetection.ts          #   evaluate shots against asteroids
      scoring.ts hints.ts      #   points + educational feedback
    levels/
      types.ts                 #   level model (+ optional campaign fields)
      levelOne.ts index.ts     #   legacy standalone level + flat registry
  assets/assetMap.ts           # sprite / icon / heart / music / SFX URLs
  styles/global.css
```

### Campaign mode

Campaign is the playable game mode (Arcade and Versus are stubbed as "coming
soon"). It is ordered **zones** of **levels** defined in `src/game/campaign/`:

- **Tutorial** — one forgiving level that teaches the grid, firing, hearts, and
  that slope sets the laser's angle (the target is off the default line, so you
  *must* change the slope).
- **Zone 1: Slope Training** — steeper integer slopes, fractional slopes, a
  sequential "one target at a time" level, and a no-preview Mastery Check, then a
  **Mission Debrief** (multiple-choice + open-ended reflection) at the zone's end.

Per-level options live on `LevelConfig` (all optional, backward-compatible):
`hearts`, `trajectoryPreview` (`always`/`after-fire`/`off`), `trajectoryStyle`,
`showCoordinates`, `sequentialTargets`, `callout`. Progress (completed levels)
persists in `localStorage`; the next level unlocks when the previous is cleared,
and the next zone when the previous zone is fully complete.

#### Adaptive difficulty (Zone 1)

Every Zone 1 level **except the first** adapts to the learner
(`src/game/campaign/difficulty.ts`). The first level of a zone is a fixed
`standard` diagnostic; from then on the tier is chosen by a **rolling**
exponential-moving-average of recent per-level scores within that zone:

- **support** — full scaffolds restored + **one extra heart** (for a learner
  who is struggling).
- **standard** — the level exactly as authored.
- **challenge** — one fewer heart and the next rung up the *scaffold ladder*
  (`always/normal → always/dimmed → after-fire → off`); a level may also add an
  extra asteroid via a per-tier `variant`.

A level is marked adaptive with `adaptive: true` on its `CampaignLevel`; the
tier deltas are derived automatically, so most levels need no per-tier data.
The performance **score** uses only shot accuracy, hearts kept, and whether the
learner passed without dying — **the calculator is a free tool and never counts
against the score.**

#### In-level calculator

A small, non-modal floating calculator (the **🧮 Calc** button in the game bar)
lets students do quick slope math like `(6−2)÷(3−1)` without leaving the level
or hiding the board. Expression parsing is delegated to `expr-eval`
(`src/game/components/calc.ts`); the panel itself is `Calculator.tsx`.

#### Captured stats (for a future profile page)

Each played level records its latest rich `LevelStats` blob (shots, hits,
misses, off-board shots, multi-hits, accuracy, hearts lost/remaining, losses,
attempts, first-try, calculator opens, control tweaks, durations,
time-to-first-shot/hit, and timestamps) under
`localStorage['slope-invaders:level-stats']`. A separate lifetime
`profile-stats` aggregate accumulates every completion, including replays, for
future profile-page totals. Most of these don't feed today's adaptivity score —
they're stored for a planned learner profile / statistics page. Read them via
`useCampaignProgress`'s `getLevelStats` / `getProfileStats`.

### Core math (all unit-tested in `src/game/logic/*.test.ts`)

`getYAtX` · `isPointOnLine` · `getMissDistance` ·
`calculateSlopeBetweenPoints` · `calculateInterceptFromPoint` ·
`graphToScreen` / `screenToGraph` · `lineBoardSegment`

## Assets

Sprites are sliced from the downloaded `SpaceShooterAssetPack` sheets (one
directory above the repo) into individual pixel-art PNGs in `src/assets/`
(nearest-neighbour upscaled for crisp edges): the player ship, the projectile
bolt, starfield background, and UI icon tiles for menu/settings controls. The
menu and game each have a looping background music track in `src/assets/`, with
volume/mute controlled from the shared settings dialog. Art with no matching
sprite — asteroids, weak points, walls/shields — is drawn directly in Konva to
match the 8-bit vibe.

## Future-readiness

The mode/zone/level model and code already make room for later milestones (look
for `TODO` comments and the `coming-soon` zones/modes):

- later campaign zones: y-intercept, negative slopes, full coordinate grid,
  hidden trajectory, shields/walls, linked asteroids, friendly ships, x-offset
  (each new mechanic carries forward into later zones)
- Arcade and Multiplayer-Versus modes (registry entries already stubbed)
- walls / shields that block shot paths (and shield gaps)
- linked asteroid groups destroyed by a single line
- alternate equation forms (`y = mx`, point-slope)

Campaign mode is the playable path today; Arcade and Multiplayer-Versus remain
stubbed as coming-soon modes.
