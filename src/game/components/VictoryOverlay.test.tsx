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
});
