/**
 * Per-zone math "refresher" content for the in-game Help drawer (help-seeking
 * support, see docs/agent/01 SRL + 04 discoverability). Plain-language reminders
 * of each zone's concept — never the answer to the current level, just the idea.
 * Keyed by zone id (`tutorial`, `zone-1` … `zone-9`).
 */
export interface ConceptHelp {
  title: string;
  /** A few short, plain-language reminders about the zone's concept. */
  points: string[];
}

const CONCEPT_HELP: Record<string, ConceptHelp> = {
  tutorial: {
    title: 'Reading the grid',
    points: [
      'Every asteroid sits at a coordinate (x, y): x across, y up.',
      'Your laser travels along the line your equation makes.',
      'Change the slope so the dashed line lands on the asteroid, then Fire.',
    ],
  },
  'zone-1': {
    title: 'Slope (y = mx)',
    points: [
      'Slope m is rise ÷ run — how fast the line climbs.',
      'A bigger m makes a steeper line; the line always passes through the origin (0, 0).',
      'To pass through a point (x, y), the slope you need is y ÷ x.',
    ],
  },
  'zone-2': {
    title: 'The y-intercept (y = mx + b)',
    points: [
      'b is where the line crosses the y-axis — it lifts the whole line up or down.',
      'The same slope can hit different targets at different values of b.',
      'A slope of 0 makes a flat, horizontal line: y = b.',
    ],
  },
  'zone-3': {
    title: 'Negative slopes',
    points: [
      'A negative slope falls as you move right — down instead of up.',
      'Here the targets are below and to the right, so you need m to be negative.',
      'A flat (m = 0) or positive slope shoots away from them.',
    ],
  },
  'zone-4': {
    title: 'The full grid & facing',
    points: [
      'The grid now has all four quadrants; the cannon sits at the origin.',
      'Slope tilts the aim up or down; the facing buttons pick which side it fires.',
      'Facing left mirrors the line across the ship (y = mx + b becomes y = -mx + b).',
    ],
  },
  'zone-5': {
    title: 'Shields & walls',
    points: [
      'A shield blocks any shot whose line crosses it — that shot is a miss.',
      'A target can be hit by many lines; pick one that reaches it without crossing a wall.',
      'There is always at least one clear line, so a 3-star run is possible.',
    ],
  },
  'zone-6': {
    title: 'Linked asteroids',
    points: [
      'Chained rocks are all-or-none: one straight line must pass through every rock.',
      'Two points determine exactly one line — find the line through them.',
      'Clipping only part of the chain destroys nothing.',
    ],
  },
  'zone-7': {
    title: 'Friendly ships',
    points: [
      'A shot whose line crosses a friendly ship is scrubbed and counts as a miss.',
      'A line is infinite — mind the whole path, not just the part near the target.',
      'Choose a slope/intercept that reaches the asteroid while clearing your allies.',
    ],
  },
  'zone-8': {
    title: 'The moving cannon',
    points: [
      'Slide the cannon left/right with the x-offset control.',
      'Moving the cannon to x = h gives the line y = m(x − h) + b.',
      'Repositioning can open a clear shot the slope alone could not.',
    ],
  },
  'zone-9': {
    title: 'Equation Forge',
    points: [
      'Type the full equation yourself — no steppers and no aiming preview.',
      'Decimals, negatives, and fractions are all allowed.',
      'Work out the slope and intercept from the target coordinates before you fire.',
    ],
  },
};

const FALLBACK: ConceptHelp = {
  title: 'Aiming with equations',
  points: [
    'Read each asteroid as a coordinate (x, y).',
    'Adjust the equation so the line passes through the target, then Fire.',
  ],
};

export function conceptHelpForZone(zoneId: string): ConceptHelp {
  return CONCEPT_HELP[zoneId] ?? FALLBACK;
}
