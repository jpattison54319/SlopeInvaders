/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildVersusLevel } from '../game/versus/field';
import { DEFAULT_KEYBINDINGS } from '../game/controls/keybindings';
import { useVersusMatch } from '../game/versus/useVersusMatch';
import { VersusMatchScreen } from './VersusMatchScreen';
import type { VersusMatchState } from '../game/versus/useVersusMatch';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock('../game/components/GameBoard', () => ({
  GameBoard: ({
    trajectoryPreview,
    m,
    b,
    shipX,
  }: {
    trajectoryPreview?: string;
    m: number;
    b: number;
    shipX: number;
  }) => (
    <div
      data-testid="versus-board"
      data-trajectory-preview={trajectoryPreview}
      data-m={m}
      data-b={b}
      data-ship-x={shipX}
    />
  ),
}));

vi.mock('../game/components/EquationControls', () => ({
  EquationControls: ({
    xOffset,
    controls,
    keyBindings,
  }: {
    xOffset: number;
    controls: string[];
    keyBindings: typeof DEFAULT_KEYBINDINGS;
  }) => (
    <div
      data-testid="versus-controls"
      data-x-offset={xOffset}
      data-controls={controls.join(',')}
      data-x-offset-up-key={keyBindings.xOffsetUp}
      data-x-offset-down-key={keyBindings.xOffsetDown}
    />
  ),
}));

vi.mock('../game/components/TacticalButton', () => ({
  TacticalButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('../game/versus/useVersusMatch', () => ({
  useVersusMatch: vi.fn(),
}));

let host: HTMLDivElement;
let root: Root;
let matchState: VersusMatchState;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);

  const level = buildVersusLevel(7);
  matchState = {
    myLevel: level,
    mirrorLevel: level,
    m: 1,
    b: 0,
    xOffset: 0,
    facing: 'right',
    shipX: 0,
    myFireM: 1,
    myFireB: 0,
    destroyed: new Set(),
    items: [],
    shot: null,
    explosions: [],
    hearts: 5,
    myTotal: level.asteroids.length,
    myCleared: 0,
    frozen: false,
    attackVisuals: [],
    opponent: null,
    oppShotSeg: null,
    oppName: '',
    connected: true,
    result: null,
    setM: vi.fn(),
    setB: vi.fn(),
    setXOffset: vi.fn(),
    setFacing: vi.fn(),
    fire: vi.fn(),
    onExplosionDone: vi.fn(),
  };
  vi.mocked(useVersusMatch).mockReturnValue(matchState);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('VersusMatchScreen', () => {
  it('disables the trajectory preview on both duel boards', () => {
    act(() => {
      root.render(
        <VersusMatchScreen
          matchId="match-1"
          seed={7}
          role="host"
          opponentStudentId={null}
          myName="Cadet"
          onExit={() => {}}
        />,
      );
    });

    const boards = host.querySelectorAll('[data-testid="versus-board"]');
    expect(boards).toHaveLength(2);
    expect(Array.from(boards).map((board) => board.getAttribute('data-trajectory-preview'))).toEqual([
      'off',
      'off',
    ]);
  });

  it('renders and keyboard-controls the campaign-style x-offset control', () => {
    const setXOffset = vi.fn();
    vi.mocked(useVersusMatch).mockReturnValue({
      ...matchState,
      xOffset: 2,
      shipX: 2,
      myFireB: -2,
      setXOffset,
    });

    act(() => {
      root.render(
        <VersusMatchScreen
          matchId="match-1"
          seed={7}
          role="host"
          opponentStudentId={null}
          myName="Cadet"
          onExit={() => {}}
        />,
      );
    });

    const controls = host.querySelector('[data-testid="versus-controls"]');
    expect(controls?.getAttribute('data-x-offset')).toBe('2');
    expect(controls?.getAttribute('data-controls')).toContain('xOffset');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    expect(setXOffset).toHaveBeenNthCalledWith(1, 3);
    expect(setXOffset).toHaveBeenNthCalledWith(2, 1);
  });

  it('honors remapped x-offset keys and passes their hints to the controls', () => {
    const setXOffset = vi.fn();
    const keyBindings = {
      ...DEFAULT_KEYBINDINGS,
      xOffsetUp: 'x',
      xOffsetDown: 'z',
    };
    vi.mocked(useVersusMatch).mockReturnValue({
      ...matchState,
      xOffset: 2,
      shipX: 2,
      myFireB: -2,
      setXOffset,
    });

    act(() => {
      root.render(
        <VersusMatchScreen
          matchId="match-1"
          seed={7}
          role="host"
          opponentStudentId={null}
          myName="Cadet"
          keyBindings={keyBindings}
          onExit={() => {}}
        />,
      );
    });

    const controls = host.querySelector('[data-testid="versus-controls"]');
    expect(controls?.getAttribute('data-x-offset-up-key')).toBe('x');
    expect(controls?.getAttribute('data-x-offset-down-key')).toBe('z');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    });
    expect(setXOffset).toHaveBeenCalledTimes(2);
    expect(setXOffset).toHaveBeenNthCalledWith(1, 3);
    expect(setXOffset).toHaveBeenNthCalledWith(2, 1);
  });

  it('mirrors the opponent x-offset with campaign-identical shot geometry', () => {
    vi.mocked(useVersusMatch).mockReturnValue({
      ...matchState,
      opponent: {
        m: 2,
        b: 3,
        xOffset: 4,
        facing: 'left',
        destroyedIds: [],
        addedAsteroids: [],
        items: [],
        hearts: 5,
        cleared: 0,
        total: 6,
      },
    });

    act(() => {
      root.render(
        <VersusMatchScreen
          matchId="match-1"
          seed={7}
          role="host"
          opponentStudentId={null}
          myName="Cadet"
          onExit={() => {}}
        />,
      );
    });

    const boards = host.querySelectorAll('[data-testid="versus-board"]');
    const opponentBoard = boards[1];
    expect(opponentBoard.getAttribute('data-m')).toBe('-2');
    expect(opponentBoard.getAttribute('data-b')).toBe('11');
    expect(opponentBoard.getAttribute('data-ship-x')).toBe('4');
  });

  it('shows confirmed sender feedback on the opponent board', () => {
    vi.mocked(useVersusMatch).mockReturnValue({
      ...matchState,
      attackVisuals: [
        {
          event: {
            id: 'attack-1',
            effect: 'freeze',
            sourceName: 'Cadet',
            sourcePoint: { x: 2, y: 4 },
            sentAt: 100,
          },
          direction: 'outgoing',
          phase: 'confirmed',
        },
      ],
      oppName: 'Rival',
    });

    act(() => {
      root.render(
        <VersusMatchScreen
          matchId="match-1"
          seed={7}
          role="host"
          opponentStudentId={null}
          myName="Cadet"
          onExit={() => {}}
        />,
      );
    });

    expect(host.textContent).toContain('OPPONENT FROZEN');
    expect(host.textContent).toContain('Opponent confirmed the effect');
    expect(host.querySelector('[aria-live="assertive"]')?.textContent).toContain(
      'was applied to your opponent',
    );
  });

  it('shows the incoming asteroid consequence on the receiving board', () => {
    vi.mocked(useVersusMatch).mockReturnValue({
      ...matchState,
      attackVisuals: [
        {
          event: {
            id: 'attack-2',
            effect: 'add',
            sourceName: 'Rival',
            sourcePoint: { x: -3, y: 2 },
            sentAt: 200,
          },
          direction: 'incoming',
          phase: 'impact',
        },
      ],
    });

    act(() => {
      root.render(
        <VersusMatchScreen
          matchId="match-1"
          seed={7}
          role="host"
          opponentStudentId={null}
          myName="Cadet"
          onExit={() => {}}
        />,
      );
    });

    expect(host.textContent).toContain('+2 ASTEROIDS ADDED');
    expect(host.textContent).toContain('Sent by Rival');
    expect(
      host
        .querySelector('section[aria-label="Your board"]')
        ?.classList.contains('versus__side--attack-impact'),
    ).toBe(true);
  });
});
