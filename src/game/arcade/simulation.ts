import {
  ARCADE_BOUNDS,
  ARCADE_COUNTDOWN_MS,
  ARCADE_FALL_MS,
  ARCADE_INTERWAVE_MS,
  ARCADE_SPAWN_GAP_MS,
  ARCADE_START_SHIELDS,
  ARCADE_THREATS_PER_WAVE,
  ARCADE_VERTICES,
  difficultyForWave,
} from './difficulty';
import { scoreArcadeHit, type ArcadeTargetScore } from './scoring';
import type { ArcadeAsteroid, ArcadeSimulation, ArcadeWall } from './types';

const X_COLUMNS = [-7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7] as const;

const RELATIVE_WALLS: readonly ArcadeWall[] = [
  // Left wall
  { from: { x: -0.7, y: -0.7 }, to: { x: -0.7, y: 0.7 } },
  // Right wall
  { from: { x: 0.7, y: -0.7 }, to: { x: 0.7, y: 0.7 } },
  // Top wall
  { from: { x: -0.7, y: 0.7 }, to: { x: 0.7, y: 0.7 } },
  // Bottom wall
  { from: { x: -0.7, y: -0.7 }, to: { x: 0.7, y: -0.7 } },
  // Top-Right diagonal wall
  { from: { x: 0.1, y: 0.7 }, to: { x: 0.7, y: 0.1 } },
  // Top-Left diagonal wall
  { from: { x: -0.7, y: 0.1 }, to: { x: -0.1, y: 0.7 } },
  // Bottom-Left diagonal wall
  { from: { x: -0.7, y: -0.1 }, to: { x: -0.1, y: -0.7 } },
  // Bottom-Right diagonal wall
  { from: { x: 0.1, y: -0.7 }, to: { x: 0.7, y: -0.1 } },
] as const;

function chooseAsteroidWalls(wave: number, random: () => number): ArcadeWall[] {
  if (wave < 4) return [];

  const wallProb = wave === 4 ? 0.25 : wave === 5 ? 0.45 : 0.60;
  if (random() > wallProb) return [];

  const count = (wave >= 5 && random() < 0.3) ? 2 : 1;
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(Math.floor(random() * RELATIVE_WALLS.length));
  }
  return Array.from(indices).map((idx) => RELATIVE_WALLS[idx]);
}

export function createArcadeSimulation(): ArcadeSimulation {
  return {
    phase: 'countdown',
    countdownMs: ARCADE_COUNTDOWN_MS,
    wave: 1,
    waveResolved: 0,
    waveSpawned: 0,
    spawnCooldownMs: 0,
    interwaveMs: 0,
    shields: ARCADE_START_SHIELDS,
    score: 0,
    streak: 0,
    longestStreak: 0,
    destroyed: 0,
    shots: 0,
    misses: 0,
    elapsedMs: 0,
    nextAsteroidId: 1,
    asteroids: [],
  };
}

function chooseColumn(state: ArcadeSimulation, random: () => number): number {
  const occupied = new Set(state.asteroids.map((asteroid) => asteroid.x));
  const available = X_COLUMNS.filter((x) => !occupied.has(x));
  const pool = available.length > 0 ? available : X_COLUMNS;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

function generateAsteroidVertices(random: () => number): number[] {
  const pool = [7, 6, 8];
  const startY = pool[Math.min(2, Math.floor(random() * 3))];
  const vertices = [startY];
  let currentY = startY;
  const stepPool = [3, 2, 4];
  while (currentY > -5) {
    const step = stepPool[Math.min(2, Math.floor(random() * 3))];
    currentY -= step;
    vertices.push(currentY);
  }
  return vertices;
}

function spawnAsteroid(state: ArcadeSimulation, random: () => number): ArcadeSimulation {
  const holdMs = difficultyForWave(state.wave).holdMs;
  const vertices = generateAsteroidVertices(random);
  const asteroid: ArcadeAsteroid = {
    id: `arcade-${state.nextAsteroidId}`,
    x: chooseColumn(state, random),
    y: vertices[0],
    phase: 'holding',
    vertexIndex: 0,
    fromY: vertices[0],
    toY: vertices[0],
    phaseElapsedMs: 0,
    phaseDurationMs: holdMs,
    vertices,
    walls: chooseAsteroidWalls(state.wave, random),
  };
  return {
    ...state,
    waveSpawned: state.waveSpawned + 1,
    spawnCooldownMs: ARCADE_SPAWN_GAP_MS,
    nextAsteroidId: state.nextAsteroidId + 1,
    asteroids: [...state.asteroids, asteroid],
  };
}

function beginFall(asteroid: ArcadeAsteroid): ArcadeAsteroid {
  const nextVertex = asteroid.vertexIndex + 1;
  const vertices = asteroid.vertices || ARCADE_VERTICES;
  const toY =
    nextVertex < vertices.length ? vertices[nextVertex] : ARCADE_BOUNDS.minY;
  return {
    ...asteroid,
    phase: 'falling',
    fromY: asteroid.y,
    toY,
    phaseElapsedMs: 0,
    phaseDurationMs: ARCADE_FALL_MS,
  };
}

function updateAsteroid(
  asteroid: ArcadeAsteroid,
  deltaMs: number,
  holdMs: number,
): { asteroid: ArcadeAsteroid | null; breached: boolean } {
  let current = { ...asteroid };
  let remaining = deltaMs;

  while (remaining > 0) {
    const phaseLeft = Math.max(0, current.phaseDurationMs - current.phaseElapsedMs);
    const consumed = Math.min(remaining, phaseLeft);
    current.phaseElapsedMs += consumed;
    remaining -= consumed;

    if (current.phase === 'falling') {
      const progress =
        current.phaseDurationMs > 0 ? Math.min(1, current.phaseElapsedMs / current.phaseDurationMs) : 1;
      current.y = current.fromY + (current.toY - current.fromY) * progress;
    }

    if (current.phaseElapsedMs < current.phaseDurationMs) break;

    if (current.phase === 'holding') {
      current = beginFall(current);
      continue;
    }

    const vertices = current.vertices || ARCADE_VERTICES;
    if (current.vertexIndex + 1 >= vertices.length) {
      return { asteroid: null, breached: true };
    }

    const vertexIndex = current.vertexIndex + 1;
    current = {
      ...current,
      y: vertices[vertexIndex],
      phase: 'holding',
      vertexIndex,
      fromY: vertices[vertexIndex],
      toY: vertices[vertexIndex],
      phaseElapsedMs: 0,
      phaseDurationMs: holdMs,
    };
  }

  return { asteroid: current, breached: false };
}

function maybeFinishWave(state: ArcadeSimulation): ArcadeSimulation {
  if (
    state.waveResolved < ARCADE_THREATS_PER_WAVE ||
    state.waveSpawned < ARCADE_THREATS_PER_WAVE ||
    state.asteroids.length > 0
  ) {
    return state;
  }
  return { ...state, phase: 'interwave', interwaveMs: ARCADE_INTERWAVE_MS };
}

export function stepArcadeSimulation(
  state: ArcadeSimulation,
  deltaMs: number,
  random: () => number = Math.random,
): ArcadeSimulation {
  const safeDelta = Math.max(0, Math.min(deltaMs, 250));
  if (safeDelta === 0 || state.phase === 'gameover') return state;

  if (state.phase === 'countdown') {
    const countdownMs = Math.max(0, state.countdownMs - safeDelta);
    return {
      ...state,
      countdownMs,
      phase: countdownMs === 0 ? 'playing' : 'countdown',
    };
  }

  if (state.phase === 'interwave') {
    const interwaveMs = Math.max(0, state.interwaveMs - safeDelta);
    if (interwaveMs > 0) return { ...state, interwaveMs };
    return {
      ...state,
      phase: 'playing',
      wave: state.wave + 1,
      waveResolved: 0,
      waveSpawned: 0,
      spawnCooldownMs: 0,
      interwaveMs: 0,
    };
  }

  const holdMs = difficultyForWave(state.wave).holdMs;
  const asteroids: ArcadeAsteroid[] = [];
  let breaches = 0;
  for (const asteroid of state.asteroids) {
    const result = updateAsteroid(asteroid, safeDelta, holdMs);
    if (result.breached) breaches += 1;
    if (result.asteroid) asteroids.push(result.asteroid);
  }

  let next: ArcadeSimulation = {
    ...state,
    asteroids,
    elapsedMs: state.elapsedMs + safeDelta,
    spawnCooldownMs: Math.max(0, state.spawnCooldownMs - safeDelta),
    shields: Math.max(0, state.shields - breaches),
    waveResolved: state.waveResolved + breaches,
    streak: breaches > 0 ? 0 : state.streak,
  };

  if (next.shields === 0) return { ...next, phase: 'gameover' };

  const { maxActive } = difficultyForWave(next.wave);
  while (
    next.waveSpawned < ARCADE_THREATS_PER_WAVE &&
    next.asteroids.length < maxActive &&
    next.spawnCooldownMs === 0
  ) {
    next = spawnAsteroid(next, random);
  }

  return maybeFinishWave(next);
}

export function recordArcadeShot(
  state: ArcadeSimulation,
  hits: readonly { asteroidId: string; score: ArcadeTargetScore }[],
): ArcadeSimulation {
  const hitIds = new Set(hits.map((hit) => hit.asteroidId));
  const actualHits = state.asteroids
    .filter((asteroid) => hitIds.has(asteroid.id))
    .map((asteroid) => {
      const requested = hits.find((hit) => hit.asteroidId === asteroid.id);
      return { asteroid, score: requested?.score ?? { moving: asteroid.phase === 'falling' } };
    });

  if (actualHits.length === 0) {
    return {
      ...state,
      shots: state.shots + 1,
      misses: state.misses + 1,
      streak: 0,
    };
  }

  const scored = scoreArcadeHit(
    state.streak,
    actualHits.map((hit) => hit.score),
  );
  return maybeFinishWave({
    ...state,
    asteroids: state.asteroids.filter((asteroid) => !hitIds.has(asteroid.id)),
    score: state.score + scored.points,
    streak: scored.streak,
    longestStreak: Math.max(state.longestStreak, scored.streak),
    destroyed: state.destroyed + actualHits.length,
    shots: state.shots + 1,
    waveResolved: state.waveResolved + actualHits.length,
  });
}

export function endArcadeRun(state: ArcadeSimulation): ArcadeSimulation {
  return { ...state, phase: 'gameover' };
}
