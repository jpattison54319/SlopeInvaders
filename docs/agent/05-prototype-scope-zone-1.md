# Prototype Scope: Full Zone 1

## Goal

Build a complete first zone rather than one isolated level.

Zone 1 demonstrates:

- onboarding
- slope-only learning
- level progression
- hearts
- feedback
- preview fading
- micro-reflection
- end-zone debrief
- locked future zones

## Zone 1 learning focus

Equation form:

```text
y = mx
```

Controls:

- `m` adjustable
- `b` locked at 0
- x-offset locked

Grid:

- Quadrant I only

Support:

- coordinates visible
- trajectory preview on early
- preview reduced or removed in mastery level

## Level 1: Tutorial Shot

Purpose: teach controls.

- Asteroid: `(3, 3)`
- Initial slope: `m = 1`
- Full preview on
- Hearts: unlimited or 5
- Feedback explains that slope changes the laser angle

Micro-reflection:

```text
What did changing slope do?
A. Changed the laser angle
B. Moved the line up/down
C. Moved the asteroid
```

## Level 2: Positive Integer Slopes

Purpose: practice simple slopes.

- Example asteroids: `(2, 4)`, `(3, 6)`
- Required slopes: `m = 2`
- Full preview on
- Hearts: 5

Feedback example:

```text
Hit! At x = 3, your equation gave y = 6, matching the asteroid at (3, 6).
```

## Level 3: Fractional Slopes

Purpose: introduce rise/run as fractions.

- Example asteroids: `(4, 2)`, `(6, 3)`
- Required slope: `m = 1/2`
- Full preview on
- Hearts: 4
- Optional slope triangle hint

## Level 4: Mixed Slope Practice

Purpose: choose among different slopes.

- Multiple targets, one active at a time
- Include slopes: `1`, `2`, `1/2`, `3/4`
- Dotted or less dominant preview
- Hearts: 4

## Level 5: Zone 1 Mastery Check

Purpose: prove slope-from-origin understanding.

- 3 asteroids
- Slope only
- `b = 0`
- Quadrant I
- Preview off until firing, or partial preview only
- Hearts: 3

End-zone reflection:

```text
Mission Debrief: Slope Training
1. How do you find the slope needed to hit an asteroid from the origin?
2. What does a larger slope do to the laser?
3. What mistake did you make most often?
4. What strategy will you use in the next zone?
```

## Locked future zones on campaign map

Show these as locked cards/nodes:

- Zone 2: Intercept Station — unlocks `b` in `y = mx + b`
- Zone 3: Negative Slope Nebula — downward-sloping lines
- Zone 4: Full Grid Galaxy — all four quadrants
- Zone 5: Shield Belt — walls and shielded asteroids
- Zone 6: Linked Asteroids — one line through multiple targets
- Zone 7: Friendly Fleet — avoid friendly ships
- Zone 8: Live Fire Mode — falling asteroids / timed challenges

## Prototype adaptive behavior

Minimum adaptive features:

1. After 2 misses, offer a hint.
2. If the student fails Level 5, retry with optional preview restored.
3. If the student clears Level 5 with no misses, unlock a no-preview bonus challenge.

## Done criteria

Prototype is complete when:

- all 5 Zone 1 levels are playable
- slope-only hit detection works
- hearts work
- feedback works
- micro-reflection appears after Level 1
- Mission Debrief appears after Level 5
- future zones are visible but locked
