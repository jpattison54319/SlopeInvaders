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

## Prototype-level adaptivity

For the first prototype, implement only simple rules:

1. After 2 misses, offer a hint.
2. After a level failure, offer practice mode or restore preview.
3. After a no-miss clear, offer bonus/no-preview mode.
4. Store concept progress in local state or a simple profile object.
