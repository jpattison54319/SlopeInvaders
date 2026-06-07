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

Use an 8-bit / pixel-art space theme that feels energetic but not childish.

Recommended:

- dark space background
- glowing coordinate grid
- bright laser line
- pixel asteroids
- clear ship/cannon sprite
- distinct shield/wall shapes
- friendly ships visually different from asteroids

The math must remain more readable than the art.

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
