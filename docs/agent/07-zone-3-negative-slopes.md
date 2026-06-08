# Zone 3: Negative Slopes (Quadrant IV, `y = mx`)

Zone 3 is the third playable campaign zone. It teaches **negative slopes** by flipping the
playfield into **Quadrant IV**.

## Learning focus

- A negative slope makes the line **fall** as x increases (y goes down as x goes up).
- The larger the size of the slope, the steeper the fall (`-3` drops faster than `-1`).
- Negative slopes can be fractions too (`-0.5`, `-1.5`, `-2.5`).
- Reading a target's coordinates gives the slope: "down over across" is negative.

Setup: **Quadrant IV** — the ship sits at the top-left origin `(0, 0)`, positive x runs right,
negative y runs down (bounds `{ minX: 0, maxX: 10, minY: -10, maxY: 0 }`). Slope-only (`y = mx`),
coordinates visible, trajectory preview on (scaffolded down by tier). The slope control starts at
`m = 0` — a flat line along the top edge the student tilts downward.

## Scaffold (5 levels)

Mirrors Zone 2: fixed diagnostic → guided practice → fractional beat → dimmed/sequential mixed
practice → no-preview mastery. The first level is the fixed `standard` diagnostic; the rest are
`adaptive`, rolling with the learner's recent **Zone-3** performance.

1. **Lines That Fall** (diagnostic): tilt the flat line down onto one falling line.
2. **Steeper Descents**: steep vs gentle negative slopes (magnitude).
3. **Half Steps Down**: fractional negative slopes.
4. **Mixed Descents** (sequential, dimmed): pick the right negative slope per target.
5. **Zone 3 Mastery Check** (no preview): pairs of targets on one falling line.

## Design decisions

- **Slope-only — the y-intercept is removed again.** If `b` were available, a student could lift
  the line to a target without ever using a negative slope, bypassing the entire lesson. Zone 3
  locks `b = 0` so a negative slope is the *only* way to reach a Quadrant-IV target.
- **Default slope `m = 0`.** Starting flat (a visible line along the top edge) gives a clear
  anchor the student tilts downward, rather than starting at a positive slope that is invisible
  off the top of the screen. A positive slope still demonstrably "shoots up and off the top."
- **Mastery defeats the flat shortcut.** Like Zone 2's two-point mastery, the check uses pairs of
  targets on one slanted falling line. A flat (`m = 0`) line can't pass through two different
  heights, so success requires a correctly computed negative slope.
- **Quadrant IV via bounds, not special-casing.** The coordinate system is bounds-driven; the
  only rendering change was making the axes span the full bounds (so the y-axis extends downward
  when `maxY = 0`). This also sets up a future all-quadrants zone. `quadrantMode` is metadata.
- **No blockers/walls** (consistent with earlier zones).
