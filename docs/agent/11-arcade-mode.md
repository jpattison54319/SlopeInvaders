# Arcade Mode: Endless Equation Defense

## Purpose

Arcade is an application and fluency mode for learners who have already been
introduced to `y = mx + b`, all four quadrants, and facing direction. It keeps
the same integrated learning loop as Campaign:

1. Read a target coordinate.
2. Build or revise a linear equation.
3. Fire along the graphed line.
4. Use mathematical feedback.
5. Repeat under gradually increasing pressure.

Arcade unlocks after every level in Zone 2 is complete. Before then, its
main-menu tile is disabled and reads `Complete Zone 2 to Unlock`. There is no
bypass modal. Completing Zone 2 means the learner has finished the dedicated
slope and y-intercept instruction required for the core `y = mx + b` Arcade
loop; later Campaign concepts remain valuable but are not required to enter.

## Revision 1 Rules

- The graph uses bounds `-8..8` on both axes.
- Asteroids spawn at safe nonzero integer x-columns, pause at
  `y = 7, 4, 1, -2, -5`, then breach at the grid boundary (`y = -8`).
- Every fall between vertices lasts `0.75s`.
- Vertex hold starts at `5.0s`, decreases by `0.25s` per wave, and never drops
  below `2.75s`.
- Each wave resolves after five destroyed or breached asteroids.
- Waves 1–2 allow one active asteroid; Wave 3 onward allows two.
- Three breaches end the run.
- A missed shot resets the streak but does not damage shields.
- Asteroids can be intercepted while falling through swept moving-target
  collision, rather than a static endpoint check.

## Pedagogical Rationale

The time pressure is bounded because the learner must still have enough time to
read a coordinate, reason about slope/intercept, operate the controls, and fire.
The mode should build fluent graph interpretation, not measure raw reaction
speed. This follows the cognitive-load, productive-struggle, and
feedback-for-revision principles in `00-agent-principles.md`,
`01-learning-design.md`, and `04-ui-audio-visual-design.md`.

Coordinates remain visible:

- parked targets show integer coordinates;
- moving targets show one decimal place;
- the graph remains higher contrast than cockpit decoration.

Feedback after misses reports the nearest approach and whether the line passed
above or below the target. This keeps feedback explanatory rather than merely
judgmental.

## Scoring and Records

Arcade has a separate local skill score:

- `100` points per asteroid;
- `+50` for a moving interception;
- `+50` per additional asteroid in a multi-hit shot;
- streak multipliers: `1x` for 1–2, `1.5x` for 3–5, `2x` for 6–9, and `3x` for
  10+ consecutive intercepted asteroids.

Each destroyed asteroid shows its exact awarded points in an 8-bit floating
label above the impact. The label includes moving-target, multi-hit, and streak
bonuses, so immediate feedback always reconciles with the score counter.

Misses and breaches reset the streak.

Arcade stores only private personal records in
`slope-invaders:arcade-records-v1`: high score, best wave, longest streak,
total runs, total destroyed, total playtime, and the last run. These appear in
Pilot Profile. Arcade does not award Campaign XP, mastery stars, badges, unlocks,
or adaptive-tier data, and Revision 1 has no public/cloud leaderboard.

## Accessibility and Pause Rules

- Settings, Escape/manual pause, and a hidden browser tab pause simulation and
  projectile time.
- Reduced motion removes decorative trails/pulses while preserving essential
  asteroid descent.
- End Run and the top-left back command require confirmation.
- The gameplay music track is used during a run; the menu track is used during
  the briefing.

## Architecture

- `src/game/arcade/simulation.ts`: pure wave, spawn, descent, breach, and state
  transitions.
- `src/game/arcade/collision.ts`: analytical swept projectile/target collision.
- `src/game/arcade/scoring.ts`: score and streak tiers.
- `src/game/arcade/records.ts`: versioned local record schema.
- `src/game/arcade/ArcadeGame.tsx`: runtime controller and cockpit.
- `src/game/arcade/ArcadeBoard.tsx`: Konva graph rendering.
- `src/app/ArcadeBriefingScreen.tsx`: pre-run rules and personal bests.

Keep Arcade mechanics separate from finite Campaign `Game.tsx` and Campaign
progress stores.
