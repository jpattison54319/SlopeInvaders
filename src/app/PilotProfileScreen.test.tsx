/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BADGES } from '../game/campaign/badges';
import type { ProfileStats } from '../game/campaign/profileStats';
import type { CampaignProgress } from './useCampaignProgress';
import { PilotProfileScreen } from './PilotProfileScreen';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

const profile: ProfileStats = {
  levelsCompleted: 7,
  totalShots: 40,
  totalHits: 30,
  totalMisses: 10,
  totalHeartsLost: 6,
  totalPlaytimeMs: 65 * 60000,
  totalCalculatorOpens: 3,
  totalAttempts: 9,
  firstPlayedAt: Date.UTC(2026, 0, 5, 12),
  lastPlayedAt: Date.UTC(2026, 5, 1, 12),
};

function fakeProgress(overrides: Partial<CampaignProgress> = {}): CampaignProgress {
  return {
    isLevelComplete: () => false,
    isLevelUnlocked: () => true,
    isZoneUnlocked: () => true,
    isZoneComplete: () => false,
    zoneClearedCount: () => 0,
    markComplete: () => undefined,
    tierForLevel: () => ({
      tier: 'standard',
      ema: NaN,
      scores: [],
      weights: [],
      thresholds: { challenge: 0.75, support: 0.45 },
      sampleCount: 0,
    }),
    getLastTierDecision: () => null,
    getLevelStats: () => undefined,
    getLevelStars: () => 1,
    getProfileStats: () => profile,
    getTotalXp: () => 700,
    getEarnedBadges: () => ({ 'slope-starter': Date.UTC(2026, 1, 2, 12) }),
    getEarnedCosmetics: () => ({}),
    syncNow: () => undefined,
    resetProgress: () => undefined,
    earnArcadeXp: () => undefined,
    ...overrides,
  };
}

describe('PilotProfileScreen', () => {
  it('shows the rank card, grouped badges, planet mastery bars, and the flight log', async () => {
    await act(async () => {
      root.render(
        <PilotProfileScreen progress={fakeProgress()} onBack={vi.fn()} onOpenSettings={vi.fn()} />,
      );
    });

    // Hero card: 700 XP = Pilot rank, progressing toward Ace at 1500.
    expect(host.querySelector('.pilot-card')).toBeTruthy();
    expect(host.querySelector('.pilot-card__rank')?.textContent).toBe('Pilot');
    expect(host.textContent).toContain('700 / 1500 XP to next rank');

    // Every badge renders, grouped, with an emblem; one is earned, the rest locked.
    expect(host.querySelectorAll('.badge-card')).toHaveLength(BADGES.length);
    expect(host.querySelectorAll('.badge-card__emblem img')).toHaveLength(BADGES.length);
    const emblemSources = Array.from(
      host.querySelectorAll<HTMLImageElement>('.badge-card__emblem img'),
      (image) => image.src,
    );
    expect(new Set(emblemSources).size).toBe(BADGES.length);
    expect(host.querySelectorAll('.badge-card--earned')).toHaveLength(1);
    expect(host.querySelectorAll('.badge-card--locked')).toHaveLength(BADGES.length - 1);
    expect(host.textContent).toContain('Zone Mastery');
    expect(host.textContent).toContain('Sharpshooting');
    expect(host.textContent).toContain('Growth');
    expect(host.textContent).toContain('Slope Starter');

    // Locked badges use forward-looking framing, never failure language.
    expect(host.textContent).toContain('Next mission:');
    expect(host.textContent).not.toMatch(/locked|failed|missing/i);

    // Planet mastery rows with planet art + progress bars, and the flight log tiles.
    expect(host.querySelectorAll('.profile__zone-row').length).toBeGreaterThanOrEqual(8);
    expect(host.querySelectorAll('.profile__zone-planet').length).toBeGreaterThanOrEqual(8);
    expect(host.querySelectorAll('.profile__zone-bar').length).toBeGreaterThanOrEqual(8);
    expect(host.textContent).toContain('Missions completed');
    expect(host.textContent).toContain('75%'); // 30 / 40
    expect(host.textContent).toContain('1h 5m');
  });

  it('shows the top rank without a next-rank target', async () => {
    await act(async () => {
      root.render(
        <PilotProfileScreen
          progress={fakeProgress({ getTotalXp: () => 6000 })}
          onBack={vi.fn()}
          onOpenSettings={vi.fn()}
        />,
      );
    });

    expect(host.querySelector('.pilot-card__rank')?.textContent).toBe('Star Legend');
    expect(host.textContent).toContain('Top rank reached');
  });

  it('shows private Arcade personal records separately from campaign progress', async () => {
    await act(async () => {
      root.render(
        <PilotProfileScreen
          progress={fakeProgress()}
          arcadeRecords={{
            highScore: 2400,
            bestWave: 6,
            longestStreak: 9,
            totalRuns: 4,
            totalDestroyed: 31,
            totalPlaytimeMs: 120000,
            lastRun: null,
          }}
          onBack={vi.fn()}
          onOpenSettings={vi.fn()}
        />,
      );
    });

    expect(host.textContent).toContain('Arcade Records');
    expect(host.textContent).toContain('2400');
    expect(host.textContent).toContain('Best wave');
    expect(host.textContent).toContain('Arcade does not award campaign XP or stars');
  });

  it('returns via the back button using the provided label', async () => {
    const onBack = vi.fn();
    await act(async () => {
      root.render(
        <PilotProfileScreen
          progress={fakeProgress()}
          backLabel="Galaxy"
          onBack={onBack}
          onOpenSettings={vi.fn()}
        />,
      );
    });

    const back = host.querySelector<HTMLButtonElement>('button[aria-label="Galaxy"]');
    expect(back).toBeTruthy();
    await act(async () => {
      back!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
