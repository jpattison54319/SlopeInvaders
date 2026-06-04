/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { music } from '../assets/assetMap';
import type { LevelEntry } from '../game/levels';
import { useMusic } from '../game/audio/useMusic';
import App from './App';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock('../game/audio/useMusic', () => ({
  useMusic: vi.fn(),
}));

vi.mock('../game/components/GameBoard', () => ({
  GameBoard: () => <div aria-label="Mock game board" />,
}));

vi.mock('../game/Game', () => ({
  Game: ({
    entry,
    onExit,
    onSettings,
  }: {
    entry: LevelEntry;
    onExit: () => void;
    onSettings: () => void;
  }) => (
    <section aria-label="Mock game screen">
      <h1>Playing {entry.name}</h1>
      <button type="button" onClick={onExit}>
        Back to menu
      </button>
      <button type="button" onClick={onSettings}>
        Game settings
      </button>
    </section>
  ),
}));

let host: HTMLDivElement;
let root: Root;

async function renderApp() {
  await act(async () => {
    root.render(<App />);
  });
}

async function click(label: string | RegExp) {
  const button = Array.from(host.querySelectorAll('button')).find((el) =>
    typeof label === 'string' ? el.textContent?.includes(label) : label.test(el.textContent ?? ''),
  );
  expect(button).toBeTruthy();
  await act(async () => {
    button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() });
  vi.mocked(useMusic).mockClear();
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

describe('App shell', () => {
  test('starts on a full menu with playable and future levels', async () => {
    await renderApp();

    const buttonLabels = Array.from(host.querySelectorAll('button')).map((button) =>
      button.textContent?.trim(),
    );

    expect(host.textContent).toContain('Slope Invaders');
    expect(host.textContent).toContain('Play Level 1');
    expect(host.textContent).toContain('Level Select');
    expect(host.textContent).toContain('First Contact');
    expect(host.textContent).toContain('Steep Descent');
    expect(host.textContent).toContain('Coming Soon');
    expect(buttonLabels).toContain('Settings');
    expect(buttonLabels).not.toContain('Audio');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.65, false);
  });

  test('settings dialog controls music volume and mute state', async () => {
    await renderApp();
    await click('Settings');

    expect(host.textContent).toContain('Settings');
    expect(host.textContent).toContain('Music Volume');

    const slider = host.querySelector<HTMLInputElement>('input[type="range"][aria-label="Music volume"]');
    expect(slider).toBeTruthy();
    expect(slider!.value).toBe('65');

    await act(async () => {
      slider!.value = '30';
      slider!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.3, false);

    await click('Mute music');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.3, true);
  });

  test('starts a selected level and swaps to game music', async () => {
    await renderApp();
    await click('Play Level 1');

    expect(host.textContent).toContain('Playing First Contact');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.game, 0.65, false);

    await click('Game settings');
    expect(host.textContent).toContain('Music Volume');

    await click('Back to menu');
    expect(host.textContent).toContain('Level Select');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.65, false);
  });
});
