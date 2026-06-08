# Zone 2: Intercept Training (`y = mx + b`)

Zone 2 is the second playable campaign zone. It builds directly on Zone 1 (slope
from the origin) by unlocking the **y-intercept `b`**, so a line no longer has to
pass through `(0, 0)`.

## Learning focus

- `b` is where the line crosses the y-axis at `(0, b)`; raising `b` slides the
  whole line up.
- The **same slope** hits different targets depending on `b` (parallel lines at
  different heights).
- Lines do not have to pass through the origin.
- A slope-0 line is **horizontal** (`y = b`).

Settings: Quadrant I, slope **and** intercept adjustable, trajectory preview on
(scaffolded down by tier), coordinates visible. The y-intercept control steps by
`0.5` (matching slope), so fractional intercepts are reachable without typing.

## Scaffold (5 levels)

Mirrors Zone 1's shape — fixed diagnostic → guided practice → harder
dimmed/sequential practice → no-preview mastery — with one extra practice beat:

1. **Lift Off the Origin** (diagnostic): one line, raise `b` with the slope left
   at its default.
2. **Flat Lines**: horizontal `y = b` (`m = 0`).
3. **Same Slope, New Height**: same slope, different `b` across two shots.
4. **Read the Line** (sequential, dimmed): pick `m` and `b` per target, including
   fractional intercepts.
5. **Zone 2 Mastery Check** (no preview): pairs of targets on one slanted line.

The first level is the fixed `standard` diagnostic; the rest are `adaptive`, so
hearts/scaffolds roll with the learner's recent **Zone-2** performance.

## Design decisions

- **Horizontal "cheese" is allowed, not punished.** A single target can be cleared
  with a flat `y = b` line. Zone 2 intentionally ships **no blockers/walls** so
  students can discover horizontal shots themselves; blockers are deferred to a
  later zone (see `05-prototype-scope-zone-1.md` future zones).
- **Mastery defeats the shortcut without punishing it.** The mastery check uses
  pairs of targets on one slanted line. A horizontal line cannot clear two points
  at different heights, so success requires correctly computing both `m` and `b` —
  the real intercept skill — rather than blocking the easy levels.
- **Fractional intercepts** appear from the mixed-practice level onward, reusing
  the same half-step control granularity already used for slope.
