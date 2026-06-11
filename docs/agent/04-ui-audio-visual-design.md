# UI, Audio, Visual Design, and Accessibility

## Interface principles

The game is an information system. The interface must clearly communicate:

- current equation
- available controls
- target coordinates when visible
- hearts remaining
- score/stars
- whether preview is enabled
- why a shot hit or missed

## Reduce cognitive overload

Do not overload the player with decorative effects while they are reasoning.

Avoid:

- too many moving objects during equation entry
- tiny coordinate labels
- low-contrast grid lines
- long text blocks during gameplay
- UI panels far away from the graph element they describe

Use:

- clean coordinate grid
- high-contrast axes
- readable labels
- short feedback messages
- equation controls near the graph
- visual highlights only for relevant targets and constraints

Arcade may use moving targets, but concurrency and timing must remain bounded:
one target in early waves, at most two in Revision 1, and a minimum `2.75s`
vertex hold. Coordinates remain visible while moving so urgency does not remove
the mathematical information needed to act.

## Multimedia design rules

Use words and visuals together when they support the same concept.

Good:

- feedback text next to the graph
- slope triangle overlay when explaining slope
- y-intercept marker when explaining `b`
- highlight target x-value when showing miss calculation

Bad:

- unrelated animation during feedback
- text explanation far away from the target
- sound effects that mask classroom instruction

## Visual style

Use a tactical arcade space-cockpit shell around the 8-bit game world. The
shooter UI kit supplies the structural chrome, controls, status rails, and
result frames. Pixel art remains appropriate for the graph, ships, asteroids,
planets, banners, stars, and mastery indicators.

Recommended:

- dark space background
- glowing coordinate grid
- bright laser line
- pixel asteroids
- clear ship/cannon sprite
- distinct shield/wall shapes
- friendly ships visually different from asteroids

The math must remain more readable than the art.

### Tactical shell rules

- Deep navy is the base; cyan defines structure, gold marks active commands,
  green signals success, and rose signals danger.
- The coordinate board is the highest-contrast and most visually important
  gameplay surface.
- Navigation utilities are icon-only, with accessible names, keyboard focus,
  and hover titles.
- Use paired normal/active artwork for asset-backed controls.
- Keep labels and changing values as responsive HTML. Do not use baked-in text.
- Use stable frame dimensions so active states cannot shift nearby controls.
- Disable decorative ship exhaust, bounce, and lighting effects when reduced
  motion is requested.

### Mission Control

The robot is a restrained instructional coach, not the player character.

Use Mission Control for:

- menu briefing
- guided-tour steps
- hints and shot feedback
- success, warning, and neutral learning messages

Do not use the robot as the pilot avatar, a decorative mascot on every panel, or
an interruption that competes with the graph. The player identity remains the
astronaut cadet/pilot.

### Asset governance

The optimized production bundle lives in `src/assets/ui/` and is typed through
`src/assets/assetMap.ts`. The original source packs stay outside the repository.
See `docs/ASSET_SOURCES.md` for provenance and licensing.

## Audio

Audio can increase atmosphere and feedback, but must be optional.

Include:

- laser firing
- subtle button click feedback for ordinary UI buttons
- asteroid explosion
- shield impact
- heart lost
- badge unlock
- subtle background music

Buttons may use a light 3D pressed state plus a short click sound to make the interface feel responsive. Avoid stacking duplicate sounds: if a button already has a semantic action sound, such as Fire using the laser SFX, it should opt out of the generic button click.

Teacher/classroom setting should default to low volume or muted option.

## Story frame

Use light narrative.

Premise:

> The player is a cadet defending planets with an equation-powered ship. The laser travels along the line created by the player’s equation.

Use story to explain mechanics:

- Quadrant I = training sector
- full grid = expanded galaxy map
- shields = protected asteroids
- linked asteroids = energy-linked targets
- friendly ships = allies in the line of fire
- no-preview mode = sensor blackout challenge

Avoid long cutscenes or lore that distracts from graphing.

## Accessibility

Support:

- keyboard controls
- mouse controls
- high-contrast mode
- colorblind-safe visual indicators
- audio mute
- reduced motion
- adjustable time pressure
- readable font size
- visible coordinate labels option
- practice mode with no hearts

Do not rely only on color. Use shapes, outlines, icons, and labels.
