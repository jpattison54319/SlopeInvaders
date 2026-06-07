/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { music } from '../assets/assetMap';
import { useMusic } from '../game/audio/useMusic';
import App from './App';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

vi.mock('../game/audio/useMusic', () => ({
  useMusic: vi.fn(),
}));

vi.mock('../game/Game', () => ({
  Game: ({
    title,
    onExit,
    onSettings,
  }: {
    title: string;
    onExit: () => void;
    onSettings: () => void;
  }) => (
    <section aria-label="Mock game screen">
      <h1>Playing {title}</h1>
      <button type="button" onClick={onExit}>
        Back to levels
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
  const matches = (el: HTMLButtonElement) => {
    const text = `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`;
    return typeof label === 'string' ? text.includes(label) : label.test(text);
  };
  const button = Array.from(host.querySelectorAll('button')).find(matches);
  expect(button, `button matching ${label}`).toBeTruthy();
  await act(async () => {
    button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function installMemoryStorage() {
  const store = new Map<string, string>();
  const ls: Storage = {
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  Object.defineProperty(window, 'localStorage', { configurable: true, value: ls });
}

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() });
  installMemoryStorage();
  vi.mocked(useMusic).mockClear();
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
});

describe('App shell', () => {
  test('starts on the mode-select menu with Campaign playable and other modes coming soon', async () => {
    await renderApp();

    const buttonLabels = Array.from(host.querySelectorAll('button')).map((button) =>
      button.textContent?.trim(),
    );

    expect(host.textContent).toContain('Slope Invaders');
    expect(host.textContent).toContain('Play Campaign');
    expect(host.textContent).toContain('Choose a Mode');
    expect(host.textContent).toContain('Arcade');
    expect(host.textContent).toContain('Versus');
    expect(host.textContent).toContain('Coming Soon');
    expect(host.querySelector('button[aria-label="Settings"]')).toBeTruthy();
    expect(host.querySelector('button[aria-label="Achievements"]')?.textContent?.trim()).toBe('');
    expect(buttonLabels.some((l) => l === 'Settings')).toBe(false);
    expect(buttonLabels.some((l) => l === 'Stats')).toBe(false);
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.65, false);
  });

  test('settings dialog controls music and sound-effect volume', async () => {
    await renderApp();
    await click('Settings');

    expect(host.textContent).toContain('Music Volume');
    expect(host.textContent).toContain('Sound FX Volume');

    const slider = host.querySelector<HTMLInputElement>('input[aria-label="Music volume"]');
    expect(slider).toBeTruthy();
    expect(slider!.value).toBe('65');

    await act(async () => {
      slider!.value = '30';
      slider!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.3, false);

    await click('Mute music');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.3, true);

    expect(host.querySelector('input[aria-label="Sound effects volume"]')).toBeTruthy();
  });

  test('campaign chrome keeps back and settings controls icon-only but accessible', async () => {
    await renderApp();
    await click('Play Campaign');

    const nav = host.querySelector('nav[aria-label="Navigation"]');
    expect(nav).toBeTruthy();

    const modes = nav!.querySelector<HTMLButtonElement>('button[aria-label="Modes"]');
    const settings = nav!.querySelector<HTMLButtonElement>('button[aria-label="Settings"]');

    expect(modes).toBeTruthy();
    expect(settings).toBeTruthy();
    expect(modes!.textContent?.trim()).toBe('');
    expect(settings!.textContent?.trim()).toBe('');
    expect(modes!.title).toBe('Modes');
    expect(settings!.title).toBe('Settings');
  });

  test('navigates mode → zone → level, swaps to game music, and back', async () => {
    await renderApp();

    await click('Play Campaign');
    expect(host.textContent).toContain('Choose a Zone');

    await click('Tutorial');
    expect(host.textContent).toContain('Tutorial Shot');

    await click('Tutorial Shot');
    expect(host.textContent).toContain('Playing Tutorial Shot');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.game, 0.65, false);

    await click('Game settings');
    expect(host.textContent).toContain('Music Volume');
    await click('Close');

    await click('Back to levels');
    expect(host.textContent).toContain('Tutorial Shot');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.65, false);
  });
});
