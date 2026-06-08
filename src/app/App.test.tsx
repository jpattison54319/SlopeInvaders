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

const PROGRESS_KEY = 'slope-invaders:campaign-progress';

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

// Skip the launch warp's timed animation in tests — advance straight to gameplay.
vi.mock('./LaunchTransition', async () => {
  const { useEffect } = await import('react');
  return {
    LaunchTransition: ({ onDone }: { onDone: () => void }) => {
      useEffect(() => {
        onDone();
      }, [onDone]);
      return null;
    },
  };
});

vi.mock('./MissionFadeTransition', async () => {
  const { useEffect } = await import('react');
  return {
    MissionFadeTransition: ({ onDone }: { onDone: () => void }) => {
      useEffect(() => {
        onDone();
      }, [onDone]);
      return null;
    },
  };
});

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

async function waitForUi(ms = 650) {
  await act(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, ms));
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

function seedCompletedLevels(levelIds: string[]) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ completedLevels: levelIds }));
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

  test('navigates mode → galaxy → mission → game, swaps to game music, and back', async () => {
    await renderApp();

    await click('Play Campaign');
    expect(host.textContent).toContain('Choose your destination');

    expect(host.querySelectorAll('.hotspot')).toHaveLength(0);

    await click('Enter Tutorial');
    await waitForUi();
    expect(host.textContent).toContain('Tutorial Surface');

    await click('Tutorial Shot');
    expect(host.textContent).toContain('Playing Tutorial Shot');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.game, 0.65, false);

    await click('Game settings');
    expect(host.textContent).toContain('Music Volume');
    await click('Close');

    await click('Back to levels');
    expect(host.textContent).toContain('Choose your destination');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.65, false);
  });

  test('galaxy dial rotates between planets and locks unreached missions', async () => {
    await renderApp();

    await click('Play Campaign');
    expect(host.textContent).toContain('Tutorial');

    // Rotate to the next planet (Zone 1), which is locked until Tutorial clears.
    await click('Next planet');
    expect(host.textContent).toContain('Slope Training');

    expect(host.querySelectorAll('.hotspot')).toHaveLength(0);
    const enterPlanet = host.querySelector<HTMLButtonElement>('button[aria-label="Enter Slope Training"]');
    expect(enterPlanet).toBeTruthy();
    expect(enterPlanet!.disabled).toBe(true);
  });

  test('planet surface shows active and locked region banners after entering a zone', async () => {
    seedCompletedLevels(['tut-1']);
    await renderApp();

    await click('Play Campaign');
    expect(host.querySelectorAll('.hotspot')).toHaveLength(0);
    expect(host.querySelectorAll('.surface-banner')).toHaveLength(0);

    await click('Enter Slope Training');
    await waitForUi();
    expect(host.textContent).toContain('Slope Training');
    expect(host.textContent).toContain('Surface');
    expect(host.querySelectorAll('.surface-region')).toHaveLength(4);
    expect(host.querySelectorAll('.surface-banner')).toHaveLength(4);
    expect(host.querySelectorAll('.surface-banner--ready')).toHaveLength(1);
    expect(host.querySelectorAll('.surface-banner--locked')).toHaveLength(3);
    expect(host.querySelector('.surface-banner--ready')?.getAttribute('aria-label')).toContain('Steeper Lines');
  });

  test('planet surface marks completed regions and launches active banners directly', async () => {
    seedCompletedLevels(['tut-1', 'z1-l1']);
    await renderApp();

    await click('Play Campaign');

    await click('Enter Slope Training');
    await waitForUi();

    expect(host.textContent).toContain('Slope Training');
    expect(host.querySelectorAll('.surface-banner--cleared')).toHaveLength(1);
    expect(host.querySelectorAll('.surface-banner--ready')).toHaveLength(1);
    expect(host.querySelectorAll('.surface-check')).toHaveLength(1);
    expect(host.querySelector('.surface-banner--ready')?.getAttribute('aria-label')).toContain(
      'Fractional Slopes',
    );

    await click('Fractional Slopes');
    expect(host.textContent).toContain('Playing Fractional Slopes');
  });

  test('view toggle switches between galaxy and classic list views', async () => {
    await renderApp();

    await click('Play Campaign');
    expect(host.textContent).toContain('Choose your destination');

    // The top-bar toggle (not the back button) switches to the list view.
    await click('List view');
    expect(host.textContent).toContain('Choose a Zone');

    // Toggling back returns to the galaxy planet view.
    await click('Planet view');
    expect(host.textContent).toContain('Choose your destination');
  });

  test('back from the classic list view exits to the mode select, not the galaxy', async () => {
    await renderApp();

    await click('Play Campaign');
    await click('List view');
    expect(host.textContent).toContain('Choose a Zone');

    // The back control just goes back (to modes) rather than toggling views.
    await click('Modes');
    expect(host.textContent).toContain('Choose a Mode');
  });
});
