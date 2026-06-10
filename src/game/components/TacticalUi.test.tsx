/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { uiButtons } from '../../assets/assetMap';
import { CoachPanel } from './CoachPanel';
import { TacticalButton } from './TacticalButton';

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
});

describe('tactical UI primitives', () => {
  test('asset-backed buttons expose normal and active artwork with an accessible label', () => {
    act(() => {
      root.render(
        <TacticalButton asset="planet" label="Planet view" selected text="Planet view" />,
      );
    });

    const button = host.querySelector('button');
    const normal = host.querySelector<HTMLImageElement>('.tactical-button__image--default');
    const active = host.querySelector<HTMLImageElement>('.tactical-button__image--active');

    expect(button?.getAttribute('aria-label')).toBe('Planet view');
    expect(button?.getAttribute('aria-pressed')).toBe('true');
    expect(button?.classList.contains('tactical-button--selected')).toBe(true);
    expect(normal?.getAttribute('src')).toBe(uiButtons.planet.default);
    expect(active?.getAttribute('src')).toBe(uiButtons.planet.active);
    expect(host.textContent).toContain('Planet view');
  });

  test('icon-only buttons keep their command in the accessibility tree', () => {
    act(() => {
      root.render(<TacticalButton asset="settings" label="Settings" size="small" />);
    });

    const button = host.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Settings');
    expect(button?.getAttribute('title')).toBe('Settings');
    expect(button?.textContent).toBe('');
  });

  test('Mission Control exposes neutral, success, and warning treatments', () => {
    act(() => {
      root.render(
        <>
          <CoachPanel>Ready.</CoachPanel>
          <CoachPanel tone="success">Target cleared.</CoachPanel>
          <CoachPanel tone="warning">Trajectory missed.</CoachPanel>
        </>,
      );
    });

    const panels = Array.from(host.querySelectorAll('[aria-label="Mission Control"]'));
    expect(panels).toHaveLength(3);
    expect(panels[0].classList.contains('coach-panel--neutral')).toBe(true);
    expect(panels[1].classList.contains('coach-panel--success')).toBe(true);
    expect(panels[2].classList.contains('coach-panel--warning')).toBe(true);
    expect(host.textContent).toContain('Target cleared.');
  });
});
