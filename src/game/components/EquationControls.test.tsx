/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { EquationControls } from './EquationControls';
import { DEFAULT_KEYBINDINGS } from '../controls/keybindings';
import type { ControlKey } from '../levels/types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const ALL_CONTROLS: ControlKey[] = ['slope', 'yIntercept', 'xOffset', 'direction'];

let container: HTMLElement;
let root: Root;

function render(props: Partial<Parameters<typeof EquationControls>[0]> = {}) {
  act(() => {
    root.render(
      <EquationControls
        m={1}
        b={0}
        xOffset={0}
        facing="right"
        onChangeM={vi.fn()}
        onChangeB={vi.fn()}
        onChangeXOffset={vi.fn()}
        onChangeFacing={vi.fn()}
        onFire={vi.fn()}
        onReset={vi.fn()}
        disabled={false}
        won={false}
        controls={ALL_CONTROLS}
        equationForm="y=mx+b"
        {...props}
      />,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('EquationControls key hints', () => {
  test('prints default keyboard shortcuts on the controls', () => {
    render({ keyBindings: DEFAULT_KEYBINDINGS });
    const hints = Array.from(container.querySelectorAll('.key-hint')).map((el) => el.textContent);
    // slope R/F, y-intercept W/S, x-offset D/A, facing Q/E, Fire Space.
    expect(hints).toEqual(expect.arrayContaining(['R', 'F', 'W', 'S', 'D', 'A', 'Q', 'E', 'Space']));
  });

  test('follows a remapped binding', () => {
    render({ keyBindings: { ...DEFAULT_KEYBINDINGS, fire: 'x' } });
    const fireBtn = container.querySelector('.btn--fire');
    expect(fireBtn?.querySelector('.key-hint')?.textContent).toBe('X');
  });

  test('omits a hint for an unassigned key', () => {
    render({ keyBindings: { ...DEFAULT_KEYBINDINGS, fire: null } });
    const fireBtn = container.querySelector('.btn--fire');
    expect(fireBtn?.querySelector('.key-hint')).toBeNull();
  });
});
