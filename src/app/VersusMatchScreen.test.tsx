/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildVersusLevel } from '../game/versus/field';
import { useVersusMatch } from '../game/versus/useVersusMatch';
import { VersusMatchScreen } from './VersusMatchScreen';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock('../game/components/GameBoard', () => ({
  GameBoard: ({ trajectoryPreview }: { trajectoryPreview?: string }) => (
    <div data-testid="versus-board" data-trajectory-preview={trajectoryPreview} />
  ),
}));

vi.mock('../game/components/EquationControls', () => ({
  EquationControls: () => null,
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

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);

  const level = buildVersusLevel(7);
  vi.mocked(useVersusMatch).mockReturnValue({
    myLevel: level,
    mirrorLevel: level,
    m: 1,
    b: 0,
    facing: 'right',
    myFireM: 1,
    destroyed: new Set(),
    items: [],
    shot: null,
    explosions: [],
    hearts: 5,
    myTotal: level.asteroids.length,
    myCleared: 0,
    frozen: false,
    opponent: null,
    oppShotSeg: null,
    oppName: '',
    connected: true,
    result: null,
    setM: vi.fn(),
    setB: vi.fn(),
    setFacing: vi.fn(),
    fire: vi.fn(),
    onExplosionDone: vi.fn(),
  });
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
});
