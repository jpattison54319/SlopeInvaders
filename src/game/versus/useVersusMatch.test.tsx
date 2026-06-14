/**
 * @vitest-environment jsdom
 */
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MatchMessage } from './types';
import { useVersusMatch } from './useVersusMatch';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const channelMock = vi.hoisted(() => ({
  send: vi.fn(),
  close: vi.fn(),
  onMessage: null as ((message: MatchMessage) => void) | null,
}));

vi.mock('../../cloud/identity', () => ({
  getOrCreateStudentId: vi.fn(() => 'student-1'),
}));

vi.mock('../../cloud/versus', () => ({
  finishMatch: vi.fn(),
  openMatchChannel: vi.fn(
    (
      _matchId: string,
      onMessage: (message: MatchMessage) => void,
      onReady: () => void,
    ) => {
      channelMock.onMessage = onMessage;
      queueMicrotask(onReady);
      return {
        send: channelMock.send,
        close: channelMock.close,
      };
    },
  ),
}));

describe('useVersusMatch attack feedback', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    channelMock.send.mockReset();
    channelMock.close.mockReset();
    channelMock.onMessage = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows, applies, acknowledges, and deduplicates an incoming freeze', async () => {
    const latest = {
      current: null as ReturnType<typeof useVersusMatch> | null,
    };

    function Harness() {
      const match = useVersusMatch('match-1', 123, 'host', 'Pilot', null);
      useEffect(() => {
        latest.current = match;
      }, [match]);
      return null;
    }

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(<Harness />));
    await act(async () => {
      await Promise.resolve();
    });

    const attack: MatchMessage = {
      type: 'attack',
      effect: 'freeze',
      event: {
        id: 'attack-1',
        effect: 'freeze',
        sourceName: 'Rival',
        sourcePoint: { x: 2, y: 4 },
        sentAt: 100,
      },
    };

    act(() => {
      channelMock.onMessage?.(attack);
    });

    expect(latest.current?.attackVisuals[0]?.phase).toBe('travel');
    expect(latest.current?.frozen).toBe(false);

    act(() => {
      vi.advanceTimersByTime(550);
    });

    expect(latest.current?.attackVisuals[0]?.phase).toBe('impact');
    expect(latest.current?.frozen).toBe(true);
    expect(channelMock.send).toHaveBeenCalledWith({
      type: 'attack-ack',
      ack: expect.objectContaining({
        attackId: 'attack-1',
        effect: 'freeze',
      }),
    });

    act(() => {
      channelMock.onMessage?.(attack);
    });
    expect(
      channelMock.send.mock.calls.filter(
        ([message]) => message.type === 'attack-ack',
      ),
    ).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2_500);
    });
    expect(latest.current?.frozen).toBe(false);

    act(() => root.unmount());
    host.remove();
  });

  it('broadcasts x-offset and derives the moving-cannon geometry', async () => {
    const latest = {
      current: null as ReturnType<typeof useVersusMatch> | null,
    };

    function Harness() {
      const match = useVersusMatch('match-1', 123, 'host', 'Pilot', null);
      useEffect(() => {
        latest.current = match;
      }, [match]);
      return null;
    }

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => root.render(<Harness />));
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      latest.current?.setXOffset(3);
    });

    expect(latest.current).toMatchObject({
      xOffset: 3,
      shipX: 3,
      myFireM: 1,
      myFireB: -3,
    });
    expect(channelMock.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'state',
        snapshot: expect.objectContaining({ xOffset: 3 }),
      }),
    );

    act(() => root.unmount());
    host.remove();
  });
});
