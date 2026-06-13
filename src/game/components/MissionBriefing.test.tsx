/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MissionBriefing } from './MissionBriefing';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('MissionBriefing', () => {
  test('shows the objective and begins on the button', () => {
    const onBegin = vi.fn();
    act(() => {
      root.render(
        <MissionBriefing
          objective="Aim with the slope to hit the asteroid."
          levelNumberLabel="Zone 1 · Level 2"
          title="Slope It"
          onBegin={onBegin}
        />,
      );
    });
    expect(container.textContent).toContain('Aim with the slope to hit the asteroid.');
    const begin = container.querySelector('.level-briefing__begin') as HTMLButtonElement;
    act(() => begin.click());
    expect(onBegin).toHaveBeenCalledTimes(1);
  });

  test('begins on Enter', () => {
    const onBegin = vi.fn();
    act(() => {
      root.render(
        <MissionBriefing objective="Read me" levelNumberLabel="Tutorial" title="T" onBegin={onBegin} />,
      );
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onBegin).toHaveBeenCalledTimes(1);
  });
});
