/**
 * @vitest-environment jsdom
 */
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { zoneOne } from '../game/campaign/levels/zone1';
import type { LevelStats } from '../game/campaign/difficulty';
import { useCampaignProgress, type CampaignProgress } from './useCampaignProgress';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const PROGRESS_KEY = 'slope-invaders:campaign-progress';
const LEVEL_STATS_KEY = 'slope-invaders:level-stats';
const PROFILE_STATS_KEY = 'slope-invaders:profile-stats';

let host: HTMLDivElement;
let root: Root;
let progress: CampaignProgress;
let storage: Storage;

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function stats(overrides: Partial<LevelStats> = {}): LevelStats {
  return {
    levelId: 'z1-l1',
    tier: 'standard',
    targets: 2,
    shots: 2,
    hits: 2,
    misses: 0,
    offBoardShots: 0,
    multiHits: 0,
    accuracy: 1,
    startHearts: 5,
    heartsLost: 0,
    heartsRemaining: 5,
    losses: 0,
    manualResets: 0,
    attempts: 1,
    passedFirstTry: true,
    calculatorOpens: 0,
    tweaks: 0,
    durationMs: 1000,
    timeToFirstShotMs: 100,
    timeToFirstHitMs: 200,
    firstPlayedAt: 10,
    completedAt: 20,
    score: 1,
    ...overrides,
  };
}

function Harness({ onProgress }: { onProgress: (next: CampaignProgress) => void }) {
  const current = useCampaignProgress();
  useEffect(() => {
    onProgress(current);
  }, [current, onProgress]);
  return null;
}

beforeEach(async () => {
  storage = createMemoryStorage();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  storage.clear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root.render(<Harness onProgress={(next) => {
      progress = next;
    }} />);
  });
});

afterEach(() => {
  if (root) {
    act(() => {
      root.unmount();
    });
  }
  host?.remove();
  storage?.clear();
});

describe('useCampaignProgress', () => {
  it('stores the latest level stats while accumulating profile totals per completion', async () => {
    await act(async () => {
      progress.markComplete('z1-l1', stats({ shots: 3, hits: 2, durationMs: 1000, completedAt: 20 }));
    });

    await act(async () => {
      progress.markComplete(
        'z1-l1',
        stats({ shots: 5, hits: 1, misses: 4, durationMs: 2500, completedAt: 50, calculatorOpens: 2 }),
      );
    });

    const latest = progress.getLevelStats('z1-l1');
    const profile = progress.getProfileStats();

    expect(latest?.shots).toBe(5);
    expect(latest?.hits).toBe(1);
    expect(profile.levelsCompleted).toBe(2);
    expect(profile.totalShots).toBe(8);
    expect(profile.totalHits).toBe(3);
    expect(profile.totalMisses).toBe(4);
    expect(profile.totalPlaytimeMs).toBe(3500);
    expect(profile.totalCalculatorOpens).toBe(2);
    expect(profile.firstPlayedAt).toBe(10);
    expect(profile.lastPlayedAt).toBe(50);
  });

  it('derives adaptive tier from prior level stats in the same zone', async () => {
    await act(async () => {
      progress.markComplete('z1-l1', stats({ levelId: 'z1-l1', score: 1 }));
    });

    expect(progress.tierForLevel(zoneOne, 0)).toBe('standard');
    expect(progress.tierForLevel(zoneOne, 1)).toBe('challenge');
  });

  it('resetProgress clears progress, per-level stats, and profile stats stores', async () => {
    await act(async () => {
      progress.markComplete('z1-l1', stats());
    });

    expect(storage.getItem(PROGRESS_KEY)).not.toBeNull();
    expect(storage.getItem(LEVEL_STATS_KEY)).not.toBeNull();
    expect(storage.getItem(PROFILE_STATS_KEY)).not.toBeNull();

    await act(async () => {
      progress.resetProgress();
    });

    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(storage.getItem(LEVEL_STATS_KEY)).toBeNull();
    expect(storage.getItem(PROFILE_STATS_KEY)).toBeNull();
  });
});
