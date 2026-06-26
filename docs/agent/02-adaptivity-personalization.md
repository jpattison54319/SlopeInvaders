# Adaptivity and Personalization

## Definitions for this project

## Customization

Learner changes surface preferences.

Examples:

- Ship skin
- Laser color
- Background
- Music on/off
- Sound effects on/off
- Avatar name

Customization can improve ownership, but it should not change the core math difficulty.

## Adaptivity

The system changes support, difficulty, or sequencing based on learner performance.

Examples:

- Repeated misses trigger a hint.
- Strong performance fades trajectory preview.
- Failed levels unlock practice mode.
- Repeated slope errors show a rise/run triangle.

## Adaptability

The system offers support options, and the learner chooses.

Example:

```text
Training Assist Available. Choose one:
- Show slope triangle
- Show trajectory preview for one shot
- Show target coordinate
- Try a practice asteroid
```

This supports self-regulated learning because students choose the support they think they need.

## Personalization

The broad umbrella: customization + adaptivity + adaptability + teacher settings.

## What the game should track

Track only data that supports learning decisions:

- hits
- misses
- hearts lost
- time per shot
- hint usage
- level failures
- whether trajectory preview was used
- concept tags for each level
- error pattern if detectable

## Simple adaptive rules

| Pattern | Possible Interpretation | Adaptive Response |
|---|---|---|
| 2 misses in a row | Student needs feedback | Offer hint |
| Misses are consistently too low | Intercept or slope too small | Suggest increasing `m` or `b`, depending on level |
| Random rapid shots | Guessing behavior | Prompt planning before next shot |
| Fails same level twice | Challenge too hard | Offer practice mode with full preview |
| No-miss clear | Ready for extension | Offer no-preview challenge |
| Overuses horizontal shots | Avoiding slope reasoning | Introduce shield blocking horizontal path |
| Struggles with fractional slope | Needs rise/run support | Show slope triangle |

## Transparency language

Avoid stigmatizing labels.

Bad:

```text
Difficulty lowered because you are struggling.
```

Good:

```text
Training Assist Available: Want a slope hint for this shot?
```

Good upward adaptation:

```text
Challenge Route Unlocked: You cleared two levels with no misses. Try No-Preview Mode?
```

### Implemented: teacher-only adaptivity transparency

Tier selection is fully observable — but only to educators, never to the
student. Every tier decision is recorded as a local trace (the resolved tier,
the EMA over prior same-zone scores, and a plain-language reason such as
"EMA 0.81 ≥ 0.75 over 3 levels → challenge"), and the cloud sync embeds each
level's resolved tier + reason so the teacher dashboard drill-down can answer
"why did this level play easier/harder?". No student-facing screen (gameplay,
victory overlay, Pilot Profile) ever renders a tier, EMA, or reason — the
in-game experience stays invisible and non-stigmatizing per this doc.

## Teacher personalization / classroom UUID mode

Teachers can create a classroom with a unique join code or UUID. Students join that classroom, and the teacher can assign campaign zones or custom settings.

Recommended teacher settings:

### Math scope

- Slope only
- Slope + y-intercept
- Negative slope
- All four quadrants
- Linked asteroids
- Friendly ships
- Movable ship / point-slope extension

### Visual scaffolds

- Full trajectory preview
- Dotted preview
- Partial preview
- No preview
- Show/hide coordinates
- Show/hide slope triangle
- Show/hide y-intercept marker

### Difficulty

- Hearts
- Shot limit
- Timer on/off
- Asteroid count
- Fractional slopes on/off
- Shields on/off
- Linked asteroids on/off
- Friendly ships on/off

### Feedback and reflection

- Detailed math feedback
- Simple feedback
- Hints on/off
- Micro-reflections on/off
- End-zone debrief required/optional

## Notation preference (fractions vs decimals)

Slope is rise-over-run, so a fraction is its native representation, and many
classrooms teach (and many students think in) fractions before decimals. The
game therefore lets the learner choose how slope/y-intercept are shown and
typed: fractions (`1/2`, `3/4`) or decimals (`0.5`, `0.75`), defaulting to
fractions. This is **customization, not adaptivity** — a surface preference the
student controls, never an invisible difficulty change and never stigmatizing.

Design rules:

- It is presentation + input only. The underlying value stays a number, so
  scoring, adaptivity, XP, badges, and hit detection are identical in either
  mode. Never key rewards or tier selection on the chosen notation.
- The student stays in control two ways: an explicit toggle button beside the
  equation, and inference from what they type (`1/2` → fractions, `.5` →
  decimals; a bare integer is ambiguous and leaves the mode unchanged).
- The two notations are mathematically equal (`1/2 = 0.5` hit the same line);
  surface that equivalence as a teaching beat rather than gating one behind the
  other as a "harder" tier — switching notation is not new math.

## Prototype-level adaptivity

For the first prototype, implement only simple rules:

1. After 2 misses, offer a hint.
2. After a level failure, offer practice mode or restore preview.
3. After a no-miss clear, offer bonus/no-preview mode.
4. Store concept progress in local state or a simple profile object.

**Status — within-level escalation is now implemented.** Rule 1 is live: miss
feedback escalates by consecutive misses on the same target (`escalateMissFeedback`
in `src/game/logic/hints.ts`, driven by a per-target streak in `Game.tsx`). Rung 2
names the exact lever as an opt-in "Training Assist"; rung 3+ reveals the needed
slope (only where unambiguous — slope-only zones) and temporarily restores the
trajectory preview ("Slope Scanner"), which is suppressed on no-preview/locked
levels so it cannot bypass a mastery check. A free **Hint** button gives the same
help on demand (help-seeking). All of this is positively framed and **never**
references the difficulty tier — tier remains teacher-only and invisible to the
student, exactly as the transparency rule above requires.
