/**
 * @vitest-environment jsdom
 */
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import { EquationControls } from './EquationControls';
import { DEFAULT_KEYBINDINGS } from '../controls/keybindings';
import type { ControlKey } from '../levels/types';
import type { NumberFormat } from '../logic/rational';

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
        notation="fraction"
        onChangeNotation={vi.fn()}
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

/** Controlled harness mirroring how Game.tsx owns the slope + notation state. */
function NotationHarness({ initial = 'fraction' as NumberFormat }) {
  const [m, setM] = useState(0.5);
  const [notation, setNotation] = useState<NumberFormat>(initial);
  return (
    <EquationControls
      m={m}
      b={0}
      xOffset={0}
      facing="right"
      onChangeM={setM}
      onChangeB={vi.fn()}
      onChangeXOffset={vi.fn()}
      onChangeFacing={vi.fn()}
      onFire={vi.fn()}
      onReset={vi.fn()}
      disabled={false}
      won={false}
      controls={['slope']}
      equationForm="y=mx"
      notation={notation}
      onChangeNotation={setNotation}
    />
  );
}

function slopeInput(): HTMLInputElement {
  return container.querySelector('input[aria-label="slope"]') as HTMLInputElement;
}
function setValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('EquationControls notation', () => {
  it('renders slope as a fraction by default', async () => {
    await act(async () => root.render(<NotationHarness />));
    expect(container.querySelector('.controls__equation')?.textContent).toBe('y = 1/2 x');
    expect(slopeInput().value).toBe('1/2');
  });

  it('keeps a typed fraction and switches mode to fraction', async () => {
    await act(async () => root.render(<NotationHarness initial="decimal" />));
    const input = slopeInput();
    await act(async () => {
      input.focus();
      setValue(input, '3/4');
    });
    await act(async () => input.blur());
    expect(slopeInput().value).toBe('3/4');
    expect(container.querySelector('.controls__equation')?.textContent).toBe('y = 3/4 x');
  });

  it('switches to decimal when the student types a decimal', async () => {
    await act(async () => root.render(<NotationHarness />));
    const input = slopeInput();
    await act(async () => {
      input.focus();
      setValue(input, '.5');
    });
    await act(async () => input.blur());
    expect(slopeInput().value).toBe('0.5');
    expect(container.querySelector('.controls__equation')?.textContent).toBe('y = 0.5x');
  });

  it('toggles display notation via the button', async () => {
    await act(async () => root.render(<NotationHarness />));
    const toggle = container.querySelector('.notation-toggle') as HTMLButtonElement;
    expect(toggle.textContent).toBe('½');
    await act(async () => toggle.click());
    expect(container.querySelector('.controls__equation')?.textContent).toBe('y = 0.5x');
    expect(slopeInput().value).toBe('0.5');
  });
});
