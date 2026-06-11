import { describe, expect, it } from 'vitest';
import {
  ARCADE_COUNTDOWN_MS,
  ARCADE_FALL_MS,
  ARCADE_START_SHIELDS,
  difficultyForWave,
} from './difficulty';
import {
  createArcadeSimulation,
  recordArcadeShot,
  stepArcadeSimulation,
} from './simulation';

function playingState() {
  let state = createArcadeSimulation();
  for (let elapsed = 0; elapsed < ARCADE_COUNTDOWN_MS; elapsed += 250) {
    state = stepArcadeSimulation(state, 250, () => 0);
  }
  return state;
}

describe('arcade simulation', () => {
  it('uses bounded hold timing and introduces a second active target at wave 3', () => {
    expect(difficultyForWave(1)).toEqual({ holdMs: 5000, maxActive: 1 });
    expect(difficultyForWave(3)).toEqual({ holdMs: 4500, maxActive: 2 });
    expect(difficultyForWave(99)).toEqual({ holdMs: 2750, maxActive: 2 });
  });

  it('spawns on a safe nonzero column and descends between five vertices', () => {
    let state = stepArcadeSimulation(playingState(), 16, () => 0);
    expect(state.asteroids).toHaveLength(1);
    expect(state.asteroids[0]).toMatchObject({ x: -7, y: 7, phase: 'holding' });

    state = stepArcadeSimulation(state, 250, () => 0);
    for (let elapsed = 250; elapsed < 5000; elapsed += 250) {
      state = stepArcadeSimulation(state, 250, () => 0);
    }
    expect(state.asteroids[0].phase).toBe('falling');
    state = stepArcadeSimulation(state, ARCADE_FALL_MS / 4, () => 0);
    state = stepArcadeSimulation(state, ARCADE_FALL_MS / 4, () => 0);
    expect(state.asteroids[0].y).toBeCloseTo(5.5);
  });

  it('only removes shields on a breach and ends after three breaches', () => {
    let state = playingState();
    for (let breach = 0; breach < ARCADE_START_SHIELDS; breach++) {
      state = stepArcadeSimulation(state, 16, () => 0);
      const asteroid = state.asteroids[0];
      state = {
        ...state,
        asteroids: [
          {
            ...asteroid,
            phase: 'falling',
            vertexIndex: 4,
            fromY: -5,
            toY: -8,
            y: -7.9,
            phaseElapsedMs: ARCADE_FALL_MS - 1,
            phaseDurationMs: ARCADE_FALL_MS,
          },
        ],
      };
      state = stepArcadeSimulation(state, 16, () => 0);
    }
    expect(state.shields).toBe(0);
    expect(state.phase).toBe('gameover');
  });

  it('misses reset streak without costing a shield', () => {
    let state = stepArcadeSimulation(playingState(), 16, () => 0);
    const asteroidId = state.asteroids[0].id;
    state = recordArcadeShot(state, [{ asteroidId, score: { moving: false } }]);
    expect(state.streak).toBe(1);
    const shields = state.shields;
    state = recordArcadeShot(state, []);
    expect(state.streak).toBe(0);
    expect(state.misses).toBe(1);
    expect(state.shields).toBe(shields);
  });
});
