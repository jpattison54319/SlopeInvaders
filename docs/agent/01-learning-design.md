# Learning Design

## Learning goals

By the end of the core campaign, learners should be able to:

1. Explain how changing `m` changes the steepness and direction of a line.
2. Explain how changing `b` shifts a line up or down.
3. Use `y = mx` to hit targets from the origin.
4. Use `y = mx + b` to hit targets not aligned with the origin.
5. Interpret positive, negative, integer, and fractional slopes.
6. Apply graphing concepts across all four quadrants.
7. Find or reason about a line passing through two points.
8. Use feedback from a miss to revise an equation.
9. Avoid invalid or unsafe lines when walls, shields, or friendly ships are present.

## Campaign progression

Current implemented order:

1. Tutorial: firing and reading the grid
2. Zone 1: `y = mx`, slope only, origin cannon
3. Zone 2: `y = mx + b`, y-intercept unlocked
4. Zone 3: negative slopes
5. Zone 4: all four quadrants
6. Zone 5: shields and walls
7. Zone 6: linked asteroids
8. Zone 7: friendly ships
9. Zone 8: movable ship / x-offset / point-slope finale

## Zone design rhythm

Each zone should use this structure:

| Level Type | Purpose |
|---|---|
| Intro | Introduce the new concept with heavy support |
| Guided Practice | Same concept, slightly less help |
| Variation | Same concept in a new layout |
| Challenge | Add pressure such as hearts or reduced preview |
| Mastery Check | Require independent performance |
| Optional Bonus | Add score, combo, or no-preview challenge |

## Problem-solving loop

Each level should support this process:

1. **Understand the problem**: What are the target coordinates and constraints?
2. **Devise a plan**: What slope/intercept should work?
3. **Carry out the plan**: Fire the laser.
4. **Look back**: Use feedback to understand why the shot hit or missed.

## Feedback design

Every shot should return:

- Hit/miss result
- Equation used
- Target coordinate
- Relevant calculation when useful
- Suggested next action when missed

Example:

```text
Miss. Your equation was y = 0.5x.
At x = 6, your line gave y = 3, but the asteroid was at y = 5.
Your line was 2 units too low.
```

## Reflection design

Do not require a long reflection after every level.

Use:

- Immediate feedback after every shot
- Micro-reflection after selected levels
- Full Mission Debrief after each zone

### Micro-reflection example

```text
What did changing slope do?
A. Changed the laser angle
B. Moved the asteroid
C. Changed the background
D. Removed a heart
```

### End-zone reflection example

```text
Mission Debrief: Zone 1
1. How do you find the slope needed to hit an asteroid from the origin?
2. What does a larger slope do to the laser?
3. What mistake did you make most often?
4. What strategy will you use in the next zone?
```

## Hearts and failure

Hearts should make choices meaningful without making failure punitive.

Suggested structure:

| Campaign Stage | Hearts | Notes |
|---|---:|---|
| Tutorial | Unlimited or 5 | Failure should be rare |
| Early Zones | 5 | Students are still learning controls |
| Middle Zones | 4 | Mistakes matter more |
| Late Zones | 3 | Mastery challenges |
| Bonus Challenges | 1–3 | Optional high-skill content |

Failing a level should allow immediate retry with no permanent penalty.
