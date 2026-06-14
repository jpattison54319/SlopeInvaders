/**
 * Pure, deterministic field generation for Versus (framework-free, unit-tested).
 *
 * Both players derive the same starting asteroid field from the match's shared
 * `level_seed`, so neither client needs to send the initial board. Attack items
 * and incoming "garbage" asteroids are generated locally and mirrored via the
 * realtime snapshot.
 */
import type { AsteroidSpec, Facing, LevelConfig } from '../levels/types';
import type { Point } from '../logic/lineMath';
import type { Bounds } from '../logic/coordinateTransform';
import type { ItemKind, VersusItem } from './types';

export const VERSUS_BOUNDS: Bounds = { minX: -8, maxX: 8, minY: -8, maxY: 8 };
export const VERSUS_HEARTS = 5;
export const VERSUS_START_ASTEROIDS = 6;
/** How long an item stays on the grid before vanishing. */
export const ITEM_LIFETIME_MS = 6000;

/** Campaign-identical moving-cannon geometry for one dialed Versus equation. */
export function versusShotGeometry(
  m: number,
  b: number,
  xOffset: number,
  facing: Facing,
): { shipX: number; fireM: number; fireB: number } {
  const shipX = xOffset;
  const bEff = b - m * xOffset;
  const fireM = facing === 'right' ? m : -m;
  const fireB = bEff + shipX * (m - fireM);
  return { shipX, fireM, fireB };
}

/** Mulberry32 — a tiny deterministic PRNG seeded from the match seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random integer grid point in [-7,7]² (never the origin), avoiding repeats. */
function randomTarget(rng: () => number, taken: Set<string>): Point {
  for (let tries = 0; tries < 100; tries++) {
    const x = Math.floor(rng() * 15) - 7;
    const y = Math.floor(rng() * 15) - 7;
    const key = `${x},${y}`;
    if ((x !== 0 || y !== 0) && !taken.has(key)) {
      taken.add(key);
      return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

/** The shared starting asteroids for a seed (ship sits at the origin). */
export function buildVersusAsteroids(seed: number): AsteroidSpec[] {
  const rng = mulberry32(seed);
  const taken = new Set<string>();
  return Array.from({ length: VERSUS_START_ASTEROIDS }, (_, i) => ({
    id: `vs-${i}`,
    weakPoint: randomTarget(rng, taken),
  }));
}

/** The shared Versus level: all quadrants, slope + intercept + x-offset + facing. */
export function buildVersusLevel(seed: number): LevelConfig {
  return {
    id: `versus-${seed}`,
    name: 'Versus Duel',
    learningGoal: 'Clear your asteroids before your rival clears theirs.',
    quadrantMode: 'all-quadrants',
    equationForm: 'y=mx+b',
    allowedControls: ['slope', 'yIntercept', 'xOffset', 'direction'],
    defaults: { m: 1, b: 0, xOffset: 0, facing: 'right' },
    bounds: VERSUS_BOUNDS,
    ship: { position: { x: 0, y: 0 } },
    asteroids: buildVersusAsteroids(seed),
    walls: [],
    linkedGroups: [],
    friendlies: [],
    maxShots: Infinity,
    hearts: VERSUS_HEARTS,
    trajectoryPreview: 'off',
    showCoordinates: true,
  };
}

/** Garbage asteroids sent by an opponent's `add` attack. */
export function makeAddedAsteroids(rng: () => number, taken: Set<string>, count: number): AsteroidSpec[] {
  return Array.from({ length: count }, () => ({
    id: `gb-${Math.floor(rng() * 1e9).toString(36)}-${Math.floor(rng() * 1e9).toString(36)}`,
    weakPoint: randomTarget(rng, taken),
  }));
}

/** A new attack item at a random open grid point, or null if none is free. */
export function spawnItem(
  rng: () => number,
  occupied: Set<string>,
  now: number,
): VersusItem | null {
  for (let tries = 0; tries < 60; tries++) {
    const x = Math.floor(rng() * 15) - 7;
    const y = Math.floor(rng() * 15) - 7;
    const key = `${x},${y}`;
    if ((x !== 0 || y !== 0) && !occupied.has(key)) {
      const kind: ItemKind = rng() < 0.5 ? 'add' : 'freeze';
      return { id: `it-${now}-${tries}`, point: { x, y }, kind, expiresAt: now + ITEM_LIFETIME_MS };
    }
  }
  return null;
}
