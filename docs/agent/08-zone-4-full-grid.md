# Zone 4: Full Coordinate Grid (`y = mx + b`, all quadrants, facing direction)

Zone 4 is the capstone campaign zone. It opens up the **full coordinate grid** (all four
quadrants, ship at the origin) and ties slope, intercept, and a new direction mechanic together.

## Learning focus

- The plane has four quadrants; a target can sit in any of them.
- **A line is infinite in both directions, but a shot travels one way.** `y = mx + b` extends
  forever; the laser only fires the way the ship faces (and the projectile always leaves the ship
  outward).
- **The ship is a cannon.** The slope is its tilt — **positive aims up, negative aims down** — and
  the **facing** control (left/right) picks the side. Slope and y-intercept place the aim through a
  point in any quadrant.

Setup: bounds `{ minX: -10, maxX: 10, minY: -10, maxY: 10 }`, ship at the origin, controls
`['slope', 'yIntercept', 'direction']`, default `m = 1, b = 0, facing = 'right'`. Every level has
**at least one asteroid per quadrant**; later levels add **more per quadrant**.

## The mirror / cannon model

Facing **mirrors the aim across the ship**, so the dialed slope means the same thing (up for
positive, down for negative) no matter which way you face:

- **Facing right** fires `y = m·x + b` (the usual line), reaching `x ≥ 0` — Q1 if `m > 0`, Q4 if `m < 0`.
- **Facing left** fires the mirror `y = -m·x + b`, reaching `x ≤ 0` — **Q2 if `m > 0`** (up-and-left),
  **Q3 if `m < 0`** (down-and-left).

With `b = 0` the rule is simply: **slope sign = up/down, facing = which side.** The y-intercept
shifts the whole aim up or down.

### Implementation (threaded with `facing: 'left' | 'right'`, default `'right'` so Zones 1–3 are unaffected)

- `Game.tsx` derives the effective fired line `fireM = facing === 'right' ? m : -m`, `fireB`
  (through the ship), and uses it for hit detection, the board, and the equation. It also orients
  the shot segment so `start` is the ship — the projectile animates ship → outward (this was the
  bug fix: previously a left shot animated from the far edge toward the ship).
- `hitDetection.ts` / `coordinateTransform.ts` take a `facing` param that gates/clips to the
  facing side (right → `x ≥ fromX`, left → `x ≤ fromX`).
- `EquationLine.tsx` draws the two-tone preview: **bright forward** (the shot) and **faded
  backward** (the line continues behind you).
- `EquationControls.tsx` renders the Left/Right toggle and shows the **facing-mirrored slope** in
  the equation (so the equation matches the dashed line), while the slope stepper keeps showing the
  value the player dialed.
- `Ship.tsx` mirrors the sprite (`scaleX = -1`) when facing left.

## Scaffold (5 levels)

Mirrors prior zones: fixed diagnostic → guided practice → mixed practice → dimmed/sequential →
no-preview mastery. The first level is the fixed `standard` diagnostic; the rest are `adaptive`.

1. **All Four Quadrants** (diagnostic): slope 1 and -1, each fired both ways, reach all four
   quadrants — teaches "slope = up/down, facing = side."
2. **Off the Origin**: non-zero `b` shifts the aim across quadrants.
3. **Read the Quadrant**: each target its own slope, intercept, and facing.
4. **Crossfire** (sequential, dimmed): six targets, some quadrants doubled.
5. **Zone 4 Mastery Check** (no preview): two dial settings fired both ways across all quadrants.

## Design decisions

- **Mirror, not "pick a half of the fixed line."** An earlier draft fired whichever half of the
  displayed `y = mx + b` matched the facing (so left + positive slope went down-left). Playtesting
  showed the intuitive cannon expectation is the opposite: a positive slope should aim **up**
  whichever way you face. Zone 4 therefore mirrors the aim when facing left (`y = -m·x + b`). The
  equation display and dashed line follow the actual shot so the math stays honest; the slope
  stepper stays as the dialed value.
- **The projectile always leaves the ship.** The shot segment is oriented to start at the ship in
  the facing direction (the original report: a left-facing shot wrongly animated toward the ship).
- **Infinite line vs one-way shot is still the headline concept**, reinforced by the faded reverse
  preview and the end-of-zone **True/False**: "`y = mx + b` is an infinite line that extends in
  both directions" (True). A second reflection checks the mirror rule (facing left + positive slope
  → Quadrant II).
- **One asteroid per quadrant minimum**, with later levels stacking extras per quadrant.
- **Mastery has no preview** and spans all quadrants with two dial settings fired both ways.
- **All-quadrants rendering reused, not special-cased** (bounds-driven; full-bounds axes from
  Zone 3). **No blockers/walls.**
