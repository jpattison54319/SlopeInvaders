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
- Plain CSS (`src/styles/global.css`)
- **Vitest** for the core math/game-logic tests

## Architecture

Rendering, math, and level data are deliberately separated:

```
src/
  app/App.tsx                  # app shell: menu/game routing + shared music settings
  app/MenuScreen.tsx           # arcade menu + future-proof level select
  app/SettingsModal.tsx        # music volume / mute controls
  game/
    Game.tsx                   # gameplay state machine: equation, fire animation, scoring, feedback
    audio/useMusic.ts          # menu/game background music hook
    components/                # React Konva + DOM UI
      GameBoard.tsx            #   Stage/Layer that composes the board + firing beam
      Grid.tsx  Axes.tsx       #   coordinate plane
      EquationLine.tsx         #   dashed aiming-line preview
      Asteroid.tsx Ship.tsx    #   sprites & pixel-art placeholders
      Wall.tsx                 #   wall/shield placeholder (future)
      Explosion.tsx            #   self-animating hit burst
      Hud.tsx                  #   score / progress / feedback panel
      EquationControls.tsx     #   slope & intercept steppers, Fire / Reset
      useImage.ts colors.ts    #   helpers
    logic/                     # pure, unit-tested — no React/Konva
      lineMath.ts              #   getYAtX, isPointOnLine, getMissDistance,
                               #   calculateSlopeBetweenPoints, calculateInterceptFromPoint
      coordinateTransform.ts   #   graphToScreen, screenToGraph, lineBoardSegment
      hitDetection.ts          #   evaluate shots against asteroids
      scoring.ts hints.ts      #   points + educational feedback
    levels/
      types.ts                 #   future-ready level model
      levelOne.ts              #   the playable level
  assets/assetMap.ts           # sprite URLs (sliced from the asset pack)
  styles/global.css
```

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

The level model and code already make room for later milestones (look for
`TODO` comments):

- walls / shields that block shot paths (and shield gaps)
- linked asteroid groups destroyed by a single line
- all four quadrants and negative slopes
- an x-offset / movable cannon
- alternate equation forms (`y = mx`, point-slope)
- multiplayer duel mode

Only single-player Level 1 is wired up in this prototype.
