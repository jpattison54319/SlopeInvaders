/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VictoryOverlay } from './VictoryOverlay';

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

describe('VictoryOverlay', () => {
  it('shows victory stats, earned stars, and next/replay actions', async () => {
    const onAdvance = vi.fn();
    const onReplay = vi.fn();

    await act(async () => {
      root.render(
        <VictoryOverlay
          shotsFired={5}
          score={500}
          stars={2}
          hasNext
          onAdvance={onAdvance}
          onReplay={onReplay}
        />,
      );
    });

    expect(host.textContent).toContain('Victory');
    expect(host.textContent).toContain('Cleared in 5 shots');
    expect(host.textContent).toContain('Score 500');
    expect(host.querySelector('.star-rating')?.getAttribute('aria-label')).toBe(
      'Mission stars: 2 of 3 stars',
    );
    expect(host.querySelectorAll('.star-rating__star--filled')).toHaveLength(2);

    const next = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Next Level'),
    );
    const replay = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Replay'),
    );

    expect(next).toBeTruthy();
    expect(replay).toBeTruthy();

    await act(async () => {
      next!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      replay!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onAdvance).toHaveBeenCalledTimes(1);
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it('shows the XP breakdown with reasons and the banked amount', async () => {
    await act(async () => {
      root.render(
        <VictoryOverlay
          shotsFired={2}
          score={200}
          stars={3}
          xp={{
            bonuses: [
              { id: 'complete', label: 'Mission complete', points: 50, reason: 'You cleared every asteroid in the level.' },
              { id: 'no-miss', label: 'No-miss clear', points: 50, reason: 'Every shot you fired hit an asteroid.' },
            ],
            runXp: 100,
            previousBestXp: 0,
            awardedXp: 100,
            newTotalXp: 100,
          }}
          hasNext
          onAdvance={vi.fn()}
          onReplay={vi.fn()}
        />,
      );
    });

    expect(host.querySelectorAll('.xp-row')).toHaveLength(2);
    expect(host.textContent).toContain('Mission complete');
    expect(host.textContent).toContain('Every shot you fired hit an asteroid.');
    expect(host.textContent).toContain('+50');
    expect(host.textContent).toContain('+100 XP banked · 100 total');
  });

  it('shows the positively framed message when the best run is already banked', async () => {
    await act(async () => {
      root.render(
        <VictoryOverlay
          shotsFired={2}
          score={200}
          stars={3}
          xp={{
            bonuses: [
              { id: 'complete', label: 'Mission complete', points: 50, reason: 'You cleared every asteroid in the level.' },
            ],
            runXp: 50,
            previousBestXp: 125,
            awardedXp: 0,
            newTotalXp: 125,
          }}
          hasNext={false}
          onAdvance={vi.fn()}
          onReplay={vi.fn()}
        />,
      );
    });

    expect(host.textContent).toContain('Best run already banked — beat it to earn more XP');
    expect(host.textContent).not.toContain('XP banked ·');
  });

  it('announces newly earned badges', async () => {
    await act(async () => {
      root.render(
        <VictoryOverlay
          shotsFired={3}
          score={300}
          stars={3}
          newBadges={[
            {
              id: 'slope-starter',
              name: 'Slope Starter',
              description: 'Cleared Zone 1 — you can aim with slope alone.',
              category: 'concept',
              earned: () => true,
            },
          ]}
          hasNext
          onAdvance={vi.fn()}
          onReplay={vi.fn()}
        />,
      );
    });

    expect(host.textContent).toContain('Badge earned!');
    expect(host.textContent).toContain('Slope Starter');
    expect(host.textContent).toContain('Cleared Zone 1 — you can aim with slope alone.');
  });

  it('omits the XP section when no award is provided', async () => {
    await act(async () => {
      root.render(
        <VictoryOverlay
          shotsFired={1}
          score={100}
          stars={1}
          hasNext
          onAdvance={vi.fn()}
          onReplay={vi.fn()}
        />,
      );
    });

    expect(host.querySelector('.game-overlay__xp')).toBeNull();
  });
});
