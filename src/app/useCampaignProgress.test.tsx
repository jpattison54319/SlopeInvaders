/**
 * @vitest-environment jsdom
 */
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { zoneOne } from '../game/campaign/levels/zone1';
import { zoneTwo } from '../game/campaign/levels/zone2';
import { zoneThree } from '../game/campaign/levels/zone3';
import { zoneFour } from '../game/campaign/levels/zone4';
import { zoneFive } from '../game/campaign/levels/zone5';
import type { LevelStats } from '../game/campaign/difficulty';
import { useCampaignProgress, type CampaignProgress } from './useCampaignProgress';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const PROGRESS_KEY = 'slope-invaders:campaign-progress';
const LEVEL_STATS_KEY = 'slope-invaders:level-stats';
const PROFILE_STATS_KEY = 'slope-invaders:profile-stats';
const LEVEL_STARS_KEY = 'slope-invaders:level-stars';
const XP_KEY = 'slope-invaders:xp';

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

  it('stores the best mastery stars without lowering them on a worse replay', async () => {
    await act(async () => {
      progress.markComplete(
        'z1-l1',
        stats({ misses: 0, heartsLost: 0, heartsRemaining: 5, startHearts: 5 }),
      );
    });

    expect(progress.getLevelStars('z1-l1')).toBe(3);

    await act(async () => {
      progress.markComplete(
        'z1-l1',
        stats({ misses: 3, heartsLost: 3, heartsRemaining: 2, startHearts: 5, completedAt: 50 }),
      );
    });

    expect(progress.getLevelStats('z1-l1')?.misses).toBe(3);
    expect(progress.getLevelStars('z1-l1')).toBe(3);
    expect(JSON.parse(storage.getItem(LEVEL_STARS_KEY) ?? '{}')['z1-l1']).toBe(3);
  });

  it('derives legacy completed level stars from saved stats, falling back to one star', async () => {
    storage.setItem(PROGRESS_KEY, JSON.stringify({ completedLevels: ['z1-l1', 'z1-l2'] }));
    storage.setItem(
      LEVEL_STATS_KEY,
      JSON.stringify({
        'z1-l1': stats({ levelId: 'z1-l1', misses: 1, heartsLost: 1, heartsRemaining: 4 }),
      }),
    );

    await act(async () => {
      root.unmount();
    });
    root = createRoot(host);
    await act(async () => {
      root.render(<Harness onProgress={(next) => {
        progress = next;
      }} />);
    });

    expect(progress.getLevelStars('z1-l1')).toBe(2);
    expect(progress.getLevelStars('z1-l2')).toBe(1);
    expect(progress.getLevelStars('z1-l3')).toBe(0);
  });

  it('derives adaptive tier from prior level stats in the same zone', async () => {
    await act(async () => {
      progress.markComplete('z1-l1', stats({ levelId: 'z1-l1', score: 1 }));
    });

    expect(progress.tierForLevel(zoneOne, 0).tier).toBe('standard');
    expect(progress.tierForLevel(zoneOne, 1).tier).toBe('challenge');
  });

  it('rolls the Zone 2 tier from prior Zone 2 stats, independent of Zone 1', async () => {
    await act(async () => {
      progress.markComplete('z2-l1', stats({ levelId: 'z2-l1', score: 1 }));
    });

    // First Zone 2 level is always the fixed standard diagnostic.
    expect(progress.tierForLevel(zoneTwo, 0).tier).toBe('standard');
    // A flawless z2-l1 lifts the next Zone 2 level to challenge.
    expect(progress.tierForLevel(zoneTwo, 1).tier).toBe('challenge');
  });

  it('rolls the Zone 3 tier from prior Zone 3 stats, independent of earlier zones', async () => {
    await act(async () => {
      progress.markComplete('z3-l1', stats({ levelId: 'z3-l1', score: 1 }));
    });

    expect(progress.tierForLevel(zoneThree, 0).tier).toBe('standard');
    expect(progress.tierForLevel(zoneThree, 1).tier).toBe('challenge');
  });

  it('rolls the Zone 4 tier from prior Zone 4 stats, independent of earlier zones', async () => {
    await act(async () => {
      progress.markComplete('z4-l1', stats({ levelId: 'z4-l1', score: 1 }));
    });

    expect(progress.tierForLevel(zoneFour, 0).tier).toBe('standard');
    expect(progress.tierForLevel(zoneFour, 1).tier).toBe('challenge');
  });

  it('rolls the Zone 5 tier from prior Zone 5 stats, independent of earlier zones', async () => {
    await act(async () => {
      progress.markComplete('z5-l1', stats({ levelId: 'z5-l1', score: 1 }));
    });

    expect(progress.tierForLevel(zoneFive, 0).tier).toBe('standard');
    expect(progress.tierForLevel(zoneFive, 1).tier).toBe('challenge');
  });

  it('emits a structured adaptivity trace for non-diagnostic level reads', async () => {
    await act(async () => {
      progress.markComplete('z1-l1', stats({ levelId: 'z1-l1', score: 1 }));
    });
    storage.removeItem('slope-invaders:adaptivity-trace');

    // Re-render so the post-render effect can flush the queue. The render is
    // triggered by re-rendering the harness; the effect then stamps a fresh
    // timestamp and writes the queued trace to localStorage.
    await act(async () => {
      progress.tierForLevel(zoneOne, 1);
    });
    await act(async () => {
      root.render(<Harness onProgress={(next) => {
        progress = next;
      }} />);
    });

    const raw = storage.getItem('slope-invaders:adaptivity-trace');
    expect(raw).not.toBeNull();
    const traces = JSON.parse(raw ?? '[]');
    expect(traces.length).toBeGreaterThanOrEqual(1);
    expect(traces[traces.length - 1]).toMatchObject({
      zoneId: 'zone-1',
      levelId: 'z1-l2',
      tier: 'challenge',
      sampleCount: 1,
    });
    expect(typeof traces[traces.length - 1].decidedAt).toBe('number');
    expect(traces[traces.length - 1].reason).toMatch(/challenge/);
  });

  it('banks first-clear XP, returns the award, and persists the store', async () => {
    let rewards: ReturnType<CampaignProgress['markComplete']>;
    await act(async () => {
      rewards = progress.markComplete('z1-l1', stats({ firstShotHit: true }));
    });

    // complete 50 + first-shot 25 + no-miss 50 = 125, all banked on a first clear.
    expect(rewards!.xp.runXp).toBe(125);
    expect(rewards!.xp.awardedXp).toBe(125);
    expect(progress.getTotalXp()).toBe(125);
    expect(JSON.parse(storage.getItem(XP_KEY) ?? '{}')).toEqual({
      totalXp: 125,
      levelBestXp: { 'z1-l1': 125 },
    });
  });

  it('banks only the improvement over a level best and never subtracts on a worse replay', async () => {
    await act(async () => {
      progress.markComplete('z1-l1', stats({ misses: 2, heartsLost: 2, heartsRemaining: 3, score: 0.5 }));
    });
    expect(progress.getTotalXp()).toBe(50); // completion only

    // Worse replay: runXp 50 again, nothing new to bank, total holds.
    let worse: ReturnType<CampaignProgress['markComplete']>;
    await act(async () => {
      worse = progress.markComplete(
        'z1-l1',
        stats({ misses: 4, heartsLost: 4, heartsRemaining: 1, score: 0.2, completedAt: 30 }),
      );
    });
    expect(worse!.xp.awardedXp).toBe(0);
    expect(progress.getTotalXp()).toBe(50);

    // Better replay: no-miss (+50) + improved-over-prior (+20) on top of completion.
    let better: ReturnType<CampaignProgress['markComplete']>;
    await act(async () => {
      better = progress.markComplete('z1-l1', stats({ misses: 0, score: 0.9, completedAt: 40 }));
    });
    expect(better!.xp.runXp).toBe(120);
    expect(better!.xp.awardedXp).toBe(70);
    expect(progress.getTotalXp()).toBe(120);
  });

  it('awards XP for legacy stats records that lack the newer optional fields', async () => {
    const legacy = stats();
    delete (legacy as Partial<LevelStats>).firstShotHit;
    delete (legacy as Partial<LevelStats>).trajectoryPreview;

    let rewards: ReturnType<CampaignProgress['markComplete']>;
    await act(async () => {
      rewards = progress.markComplete('z1-l1', legacy);
    });

    expect(rewards!.xp.runXp).toBe(100); // complete + no-miss; no first-shot bonus
  });

  it('resetProgress clears progress, per-level stats, profile, and XP stores', async () => {
    await act(async () => {
      progress.markComplete('z1-l1', stats());
    });

    expect(storage.getItem(PROGRESS_KEY)).not.toBeNull();
    expect(storage.getItem(LEVEL_STATS_KEY)).not.toBeNull();
    expect(storage.getItem(PROFILE_STATS_KEY)).not.toBeNull();
    expect(storage.getItem(LEVEL_STARS_KEY)).not.toBeNull();
    expect(storage.getItem(XP_KEY)).not.toBeNull();

    await act(async () => {
      progress.resetProgress();
    });

    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(storage.getItem(LEVEL_STATS_KEY)).toBeNull();
    expect(storage.getItem(PROFILE_STATS_KEY)).toBeNull();
    expect(storage.getItem(LEVEL_STARS_KEY)).toBeNull();
    expect(storage.getItem(XP_KEY)).toBeNull();
    expect(progress.getTotalXp()).toBe(0);
  });
});
