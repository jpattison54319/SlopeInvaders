/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { EquationSlots } from './EquationSlots';

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
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

// Helper to simulate React input changes in JSDOM
function setInputValue(input: HTMLInputElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('EquationSlots component', () => {
  test('renders slope-intercept form (y = mx + b) and starts empty/invalid', () => {
    const onChangeM = vi.fn();
    const onChangeB = vi.fn();
    const onChangeXOffset = vi.fn();
    const onValidityChange = vi.fn();

    act(() => {
      root.render(
        <EquationSlots
          facing="right"
          equationForm="y=mx+b"
          onChangeM={onChangeM}
          onChangeB={onChangeB}
          onChangeXOffset={onChangeXOffset}
          onValidityChange={onValidityChange}
          disabled={false}
        />,
      );
    });

    const inputs = host.querySelectorAll('input');
    expect(inputs).toHaveLength(2); // m and b
    expect(inputs[0].getAttribute('placeholder')).toBe('m');
    expect(inputs[1].getAttribute('placeholder')).toBe('b');
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');

    // Should report invalid initially because slots are empty
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
  });

  test('renders point-slope form (y = m(x - h) + b)', () => {
    const onChangeM = vi.fn();
    const onChangeB = vi.fn();
    const onChangeXOffset = vi.fn();
    const onValidityChange = vi.fn();

    act(() => {
      root.render(
        <EquationSlots
          facing="right"
          equationForm="point-slope"
          onChangeM={onChangeM}
          onChangeB={onChangeB}
          onChangeXOffset={onChangeXOffset}
          onValidityChange={onValidityChange}
          disabled={false}
        />,
      );
    });

    const inputs = host.querySelectorAll('input');
    expect(inputs).toHaveLength(3); // m, h, b
    expect(inputs[0].getAttribute('placeholder')).toBe('m');
    expect(inputs[1].getAttribute('placeholder')).toBe('h');
    expect(inputs[2].getAttribute('placeholder')).toBe('b');
  });

  test('validates inputs, evaluates fractions, and echoes parsed line', () => {
    const onChangeM = vi.fn();
    const onChangeB = vi.fn();
    const onChangeXOffset = vi.fn();
    const onValidityChange = vi.fn();

    act(() => {
      root.render(
        <EquationSlots
          facing="right"
          equationForm="y=mx+b"
          onChangeM={onChangeM}
          onChangeB={onChangeB}
          onChangeXOffset={onChangeXOffset}
          onValidityChange={onValidityChange}
          disabled={false}
        />,
      );
    });

    const inputs = host.querySelectorAll('input');
    const mInput = inputs[0];
    const bInput = inputs[1];

    // Focus and type slope fraction "3/4"
    act(() => {
      mInput.focus();
      setInputValue(mInput, '3/4');
    });
    expect(mInput.value).toBe('3/4');
    expect(onChangeM).toHaveBeenCalledWith(0.75);
    expect(onValidityChange).toHaveBeenLastCalledWith(false); // still invalid because b is empty

    // Blur
    act(() => {
      mInput.blur();
    });

    // Focus and type intercept "-2"
    act(() => {
      bInput.focus();
      setInputValue(bInput, '-2');
    });
    expect(bInput.value).toBe('-2');
    expect(onChangeB).toHaveBeenCalledWith(-2);
    expect(onValidityChange).toHaveBeenLastCalledWith(true); // now both are valid immediately without blur!

    // Blur
    act(() => {
      bInput.blur();
    });

    // Verify echo is rendered
    const echo = host.querySelector('.slots__echo');
    expect(echo).toBeTruthy();
    expect(echo?.textContent).toContain('Your line: y = 0.75x - 2');
  });

  test('reverts invalid expressions on blur to last committed value', () => {
    const onChangeM = vi.fn();
    const onChangeB = vi.fn();
    const onChangeXOffset = vi.fn();
    const onValidityChange = vi.fn();

    act(() => {
      root.render(
        <EquationSlots
          facing="right"
          equationForm="y=mx"
          onChangeM={onChangeM}
          onChangeB={onChangeB}
          onChangeXOffset={onChangeXOffset}
          onValidityChange={onValidityChange}
          disabled={false}
        />,
      );
    });

    const mInput = host.querySelector('input')!;

    // Focus and type a valid number first
    act(() => {
      mInput.focus();
      setInputValue(mInput, '2.5');
    });
    act(() => {
      mInput.blur();
    });
    expect(onChangeM).toHaveBeenLastCalledWith(2.5);
    expect(mInput.value).toBe('2.5');

    // Focus and type something invalid and blur
    act(() => {
      mInput.focus();
      setInputValue(mInput, '2/');
    });
    act(() => {
      mInput.blur();
    });
    // Should revert back to 2.5
    expect(mInput.value).toBe('2.5');
  });

  test('cycles focus on Enter and focuses the fire button on the final slot', () => {
    const onChangeM = vi.fn();
    const onChangeB = vi.fn();
    const onChangeXOffset = vi.fn();
    const onValidityChange = vi.fn();

    // Create a mock fire button in the test document
    const fireBtn = document.createElement('button');
    fireBtn.className = 'btn--fire';
    document.body.appendChild(fireBtn);

    act(() => {
      root.render(
        <EquationSlots
          facing="right"
          equationForm="y=mx+b"
          onChangeM={onChangeM}
          onChangeB={onChangeB}
          onChangeXOffset={onChangeXOffset}
          onValidityChange={onValidityChange}
          disabled={false}
        />,
      );
    });

    const inputs = host.querySelectorAll('input');
    const mInput = inputs[0];
    const bInput = inputs[1];

    // Focus first input
    mInput.focus();
    expect(document.activeElement).toBe(mInput);

    // Type valid and press Enter on m
    act(() => {
      setInputValue(mInput, '1');
    });
    act(() => {
      mInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
    });
    // Should advance focus to b input
    expect(document.activeElement).toBe(bInput);
    expect(onChangeM).toHaveBeenCalledWith(1);

    // Press Enter on b (final input)
    act(() => {
      setInputValue(bInput, '3');
    });
    act(() => {
      bInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
    });
    // Should advance focus to the mock fire button
    expect(document.activeElement).toBe(fireBtn);
    expect(onChangeB).toHaveBeenCalledWith(3);

    fireBtn.remove();
  });
});
