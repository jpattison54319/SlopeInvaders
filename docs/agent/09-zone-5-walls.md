# Zone 5: Shields & Walls (constraints force better line choices)

Zone 5 is the sixth campaign zone (Tutorial + Zones 1–5). It keeps the full-grid Zone 4 stage
(all four quadrants, ship at the origin, slope + y-intercept + facing) and adds **walls/shields**
that block shots which cross them.

## Learning focus

- One target can be hit by **many** equations — infinitely many lines pass through a point.
- **Obstacles make some equations invalid**: a wall blocks the lines that cross it, so not every
  line through the target is usable.
- Students must **adjust slope and intercept strategically** to find a line that reaches the weak
  point without crossing a shield.
- **Horizontal shots aren't always useful**: a wall placed in front of an asteroid at its height
  blocks the flat (slope 0) line, but a sloped line slips above/below it.

## The wall-blocking model

- A `WallSpec { id, from, to, gaps? }` is a line segment (rendered by `Wall.tsx`).
- `hitDetection.segmentIntersection` finds where the shot path crosses a wall;
  `firstWallHit(from, to, walls)` returns the nearest crossing to the ship (skipping any crossing
  that lands inside a `gap` sub-segment); `isPathBlocked` is `firstWallHit !== null`.
- `evaluateAsteroid` checks the segment from the launch point `(fromX, m·fromX + b)` to the weak
  point: an on-line, in-range target with a wall in the way is marked `blocked` (and `hit: false`).
- `Game.tsx` truncates the fired beam at the first wall (`firstWallHit`) so the laser visibly
  stops at the shield, and when a shot destroys nothing because of a wall it shows a **"Blocked!"**
  message. Walls default to `[]`, so Zones 1–4 are unaffected.

## Star adherence (0-miss-solvable)

The per-level 1–3 star rating (`src/game/campaign/stars.ts`) gives 3 stars only for a clean clear
(no misses, no hearts lost). A blocked shot destroys nothing → it counts as a miss → it costs a
star. So Zone 5 **rewards reasoning the valid line out before firing** (the trajectory preview lets
students see a line crossing a wall). Every level is designed so each asteroid keeps at least one
clear, reachable line — 3 stars is always achievable. `zone5.test.ts` locks this: for each level
the intended `(m, b, facing)` solutions hit every asteroid (none blocked), and a named "tempting"
line is confirmed blocked.

## Scaffold (5 levels)

Mirrors prior zones: fixed diagnostic → guided → harder → boxed-in → no-preview mastery. The first
level is the fixed `standard` diagnostic; the rest are `adaptive` with optional challenge variants.

1. **Shields Up** (diagnostic): one wall blocks the obvious line; a different slope/intercept reaches the target.
2. **Pick the Angle**: a wall in front of each asteroid blocks the flat shot — use a sloped line.
3. **Many Lines, Few Valid**: a target reachable by many lines, with walls invalidating most; a left-side target uses facing.
4. **Boxed In**: two walls bracket an asteroid so only 1–2 lines thread through (precise slope **and** intercept).
5. **Zone 5 Mastery Check** (no preview): several fortified asteroids across quadrants.

## Design decisions

- **Walls are line segments of any orientation.** Most are *vertical* (block the flat/horizontal
  shot at a target's height; a steeper or lower line passes above/below). Some are **45° diagonal**
  shields (slope ±1, in z5-l3 and z5-l5) that sit across a target's diagonal so the obvious sloped
  fire (e.g. `y = x` or `y = -x`) is blocked and the student must change slope to round it — this
  is the "specific sloped slot" from the design brief. Note a wall can only block lines that *cross*
  it: a wall parallel to the shot (e.g. a horizontal wall vs a horizontal beam, or a 45° wall vs a
  parallel 45° shot) won't intersect, so to block a diagonal you use the *opposite* 45° diagonal.
- **Full-grid + facing stage** (not a simpler quadrant): Zone 5 layers the constraint concept on
  top of everything from Zone 4, so most targets are right-side (facing right) with a few left-side
  targets to keep facing in play.
- **No true vertical shots**: the engine only fires `y = mx + b`, so "vertical" is just a very
  steep slope; walls block horizontal and sloped approaches.
- **Gaps are supported but unused by the shipped levels** — `WallSpec.gaps` lets a future level
  carve an opening a shot can thread; Zone 5 instead uses an open *side* (no wall there).
- **No new helper**: levels reuse `fullGridLevel` and supply `walls`.

## SRL reflections (end of zone)

1. A wall blocks your shot — what do you change? → adjust slope/intercept to route around it.
2. **(True/False)** "Each asteroid can be hit by only one possible equation." → **False** (many
   lines pass through a point; walls just rule some out).
3. Why is a flat (slope 0) shot sometimes useless here? → a wall blocks that height while a sloped
   line still reaches the target.
