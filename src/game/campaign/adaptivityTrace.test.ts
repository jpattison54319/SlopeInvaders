/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearAdaptivityTraces,
  describeTierDecision,
  readAdaptivityTraces,
  readAdaptivityTracesForZone,
  recordAdaptivityTrace,
  type AdaptivityTrace,
} from './adaptivityTrace';

function trace(over: Partial<AdaptivityTrace> = {}): AdaptivityTrace {
  return {
    id: `t-${Math.random()}`,
    decidedAt: 1000,
    zoneId: 'zone-1',
    levelId: 'z1-l2',
    levelIndex: 1,
    tier: 'standard',
    ema: 0.6,
    scores: [0.5, 0.7],
    weights: [0.4, 0.6],
    levelIds: ['z1-l1', 'tut-1'],
    sampleCount: 2,
    thresholds: { challenge: 0.75, support: 0.45 },
    reason: 'EMA 0.62 between thresholds over 2 levels → standard.',
    event: 'tier-decision',
    ...over,
  };
}

function installMemoryStorage() {
  const store = new Map<string, string>();
  const ls: Storage = {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  Object.defineProperty(window, 'localStorage', { configurable: true, value: ls });
}

beforeEach(() => {
  installMemoryStorage();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('adaptivityTrace', () => {
  it('appends a trace and reads it back', () => {
    recordAdaptivityTrace(trace({ id: 'a' }));
    recordAdaptivityTrace(trace({ id: 'b' }));
    const all = readAdaptivityTraces();
    expect(all.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('filters traces by zone', () => {
    recordAdaptivityTrace(trace({ id: 'a', zoneId: 'zone-1' }));
    recordAdaptivityTrace(trace({ id: 'b', zoneId: 'zone-2' }));
    expect(readAdaptivityTracesForZone('zone-1').map((t) => t.id)).toEqual(['a']);
  });

  it('trims the buffer to the most recent 200 entries', () => {
    for (let i = 0; i < 250; i++) {
      recordAdaptivityTrace(trace({ id: `t-${i}`, decidedAt: i }));
    }
    const all = readAdaptivityTraces();
    expect(all).toHaveLength(200);
    // Newest first; we kept the last 200 inserts (50..249).
    expect(all[0].id).toBe('t-249');
    expect(all[199].id).toBe('t-50');
  });

  it('clearAdaptivityTraces wipes the storage key', () => {
    recordAdaptivityTrace(trace());
    clearAdaptivityTraces();
    expect(readAdaptivityTraces()).toEqual([]);
  });

  it('survives malformed localStorage payloads', () => {
    window.localStorage.setItem('slope-invaders:adaptivity-trace', 'not json');
    expect(readAdaptivityTraces()).toEqual([]);
  });
});

describe('describeTierDecision', () => {
  it('explains a challenge decision with the EMA + threshold', () => {
    expect(
      describeTierDecision({
        tier: 'challenge',
        ema: 0.81,
        sampleCount: 3,
        thresholds: { challenge: 0.75, support: 0.45 },
      }),
    ).toBe('EMA 0.81 ≥ 0.75 over 3 levels → challenge.');
  });

  it('explains a support decision', () => {
    expect(
      describeTierDecision({
        tier: 'support',
        ema: 0.32,
        sampleCount: 2,
        thresholds: { challenge: 0.75, support: 0.45 },
      }),
    ).toBe('EMA 0.32 ≤ 0.45 over 2 levels → support.');
  });

  it('handles the empty-history case', () => {
    expect(
      describeTierDecision({
        tier: 'standard',
        ema: NaN,
        sampleCount: 0,
        thresholds: { challenge: 0.75, support: 0.45 },
      }),
    ).toBe('No prior scores in this zone — defaulted to standard.');
  });

  it('uses singular "level" for a single sample', () => {
    const s = describeTierDecision({
      tier: 'standard',
      ema: 0.6,
      sampleCount: 1,
      thresholds: { challenge: 0.75, support: 0.45 },
    });
    expect(s).toMatch(/over 1 level[^s]/);
  });
});
