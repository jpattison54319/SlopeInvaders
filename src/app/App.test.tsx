/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { music, uiButtons } from '../assets/assetMap';
import { useMusic } from '../game/audio/useMusic';
import { orderedLevels } from '../game/campaign/zones';
import App from './App';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const PROGRESS_KEY = 'slope-invaders:campaign-progress';
const LEVEL_STATS_KEY = 'slope-invaders:level-stats';

vi.mock('../game/audio/useMusic', () => ({
  useMusic: vi.fn(),
}));

// The campaign-finale fireworks render to a Konva canvas; stub them out so the
// app shell tests don't pull in the (canvas-dependent) Konva node build.
vi.mock('../game/components/Fireworks', () => ({
  Fireworks: () => null,
}));

vi.mock('../game/Game', () => ({
  Game: ({
    level,
    title,
    onExit,
    onSettings,
    onAdvance,
    onComplete,
  }: {
    level: { id: string; asteroids: unknown[]; hearts?: number };
    title: string;
    onExit: () => void;
    onSettings: () => void;
    onAdvance: () => void;
    onComplete: (
      levelId: string,
      stats: {
        levelId: string;
        tier: 'standard';
        targets: number;
        shots: number;
        hits: number;
        misses: number;
        offBoardShots: number;
        multiHits: number;
        accuracy: number;
        startHearts: number;
        heartsLost: number;
        heartsRemaining: number;
        losses: number;
        manualResets: number;
        attempts: number;
        passedFirstTry: boolean;
        calculatorOpens: number;
        tweaks: number;
        durationMs: number;
        timeToFirstShotMs: number;
        timeToFirstHitMs: number;
        firstPlayedAt: number;
        completedAt: number;
        score: number;
      },
    ) => void;
  }) => (
    <section aria-label="Mock game screen">
      <h1>Playing {title}</h1>
      <button type="button" onClick={onExit}>
        Back to levels
      </button>
      <button type="button" onClick={onSettings}>
        Game settings
      </button>
      <button
        type="button"
        onClick={() => {
          const startHearts = level.hearts ?? Infinity;
          onComplete(level.id, {
            levelId: level.id,
            tier: 'standard',
            targets: level.asteroids.length,
            shots: level.asteroids.length,
            hits: level.asteroids.length,
            misses: 0,
            offBoardShots: 0,
            multiHits: 0,
            accuracy: 1,
            startHearts,
            heartsLost: 0,
            heartsRemaining: startHearts,
            losses: 0,
            manualResets: 0,
            attempts: 1,
            passedFirstTry: true,
            calculatorOpens: 0,
            tweaks: 0,
            durationMs: 1000,
            timeToFirstShotMs: 100,
            timeToFirstHitMs: 200,
            firstPlayedAt: 10,
            completedAt: 20,
            score: 1,
          });
          onAdvance();
        }}
      >
        Win mock
      </button>
    </section>
  ),
}));

vi.mock('../game/arcade/ArcadeGame', () => ({
  ArcadeGame: ({
    onOpenSettings,
    onRecordRun,
    onExit,
  }: {
    onOpenSettings: () => void;
    onRecordRun: (run: {
      score: number;
      wave: number;
      longestStreak: number;
      destroyed: number;
      shots: number;
      misses: number;
      durationMs: number;
      endedAt: number;
    }) => void;
    onExit: () => void;
  }) => (
    <section aria-label="Mock arcade screen">
      <h1>Arcade Run Active</h1>
      <button type="button" onClick={onOpenSettings}>
        Arcade settings
      </button>
      <button
        type="button"
        onClick={() =>
          onRecordRun({
            score: 1250,
            wave: 4,
            longestStreak: 7,
            destroyed: 16,
            shots: 20,
            misses: 4,
            durationMs: 60000,
            endedAt: 100,
          })
        }
      >
        Finish arcade mock
      </button>
      <button type="button" onClick={onExit}>
        Exit arcade mock
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

function seedLevelStats(stats: Record<string, unknown>) {
  localStorage.setItem(LEVEL_STATS_KEY, JSON.stringify(stats));
}

function levelStats(overrides: Record<string, unknown> = {}) {
  return {
    levelId: 'z1-l1',
    tier: 'standard',
    targets: 2,
    shots: 2,
    hits: 2,
    misses: 0,
    offBoardShots: 0,
    multiHits: 0,
    accuracy: 1,
    startHearts: 5,
    heartsLost: 0,
    heartsRemaining: 5,
    losses: 0,
    manualResets: 0,
    attempts: 1,
    passedFirstTry: true,
    calculatorOpens: 0,
    tweaks: 0,
    durationMs: 1000,
    timeToFirstShotMs: 100,
    timeToFirstHitMs: 200,
    firstPlayedAt: 10,
    completedAt: 20,
    score: 1,
    ...overrides,
  };
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
  test('starts with Arcade locked until Campaign is complete', async () => {
    await renderApp();

    const buttonLabels = Array.from(host.querySelectorAll('button')).map((button) =>
      button.textContent?.trim(),
    );

    expect(host.textContent).toContain('Slope Invaders');
    expect(host.textContent).toContain('Play Campaign');
    expect(host.textContent).toContain('Choose a Mode');
    expect(host.textContent).toContain('Arcade');
    expect(host.textContent).toContain('Versus');
    expect(host.textContent).not.toContain('Coming Soon');
    expect(host.textContent).toContain('Beat Campaign to Unlock');
    expect(host.textContent?.match(/Ready/g)?.length).toBe(2);
    const arcadeButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Arcade'),
    );
    expect(arcadeButton?.disabled).toBe(true);
    const settingsButton = host.querySelector<HTMLButtonElement>('button[aria-label="Settings"]');
    const profileButton = host.querySelector<HTMLButtonElement>('button[aria-label="Pilot Profile"]');
    const settingsIcon = settingsButton?.querySelector<HTMLImageElement>(
      '.tactical-button__image--default',
    );
    const profileIcon = profileButton?.querySelector<HTMLImageElement>(
      '.tactical-button__image--default',
    );
    expect(settingsButton).toBeTruthy();
    expect(profileButton?.textContent?.trim()).toBe('');
    expect(profileButton?.className).toBe(settingsButton?.className);
    expect(profileIcon?.className).toBe(settingsIcon?.className);
    expect(profileIcon?.getAttribute('src')).toBe(uiButtons.profile.default);
    expect(settingsIcon?.getAttribute('src')).toBe(uiButtons.settings.default);
    expect(buttonLabels.some((l) => l === 'Settings')).toBe(false);
    expect(buttonLabels.some((l) => l === 'Stats')).toBe(false);
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.menu, 0.65, false);
  });

  test('does not offer an Arcade bypass before Campaign completion', async () => {
    await renderApp();

    const arcadeButton = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Arcade'),
    );
    expect(arcadeButton?.disabled).toBe(true);
    expect(host.textContent).not.toContain('Campaign Recommended');
    expect(host.textContent).not.toContain('Play Arcade Anyway');
  });

  test('campaign graduates can enter Arcade and complete its app flow', async () => {
    seedCompletedLevels(orderedLevels.map(({ level }) => level.id));
    await renderApp();

    expect(host.textContent).not.toContain('Beat Campaign to Unlock');
    expect(host.textContent?.match(/Ready/g)?.length).toBe(3);
    await click('Arcade');
    expect(host.textContent).toContain('Arcade Run');
    expect(host.textContent).toContain('Flight Plan');

    await click('Start Arcade Run');
    expect(host.textContent).toContain('Arcade Run Active');
    expect(vi.mocked(useMusic)).toHaveBeenLastCalledWith(music.game, 0.65, false);

    await click('Arcade settings');
    expect(host.textContent).toContain('Music Volume');
    await click('Close');
    await click('Finish arcade mock');
    await click('Exit arcade mock');

    await click('Pilot Profile');
    expect(host.textContent).toContain('Arcade Records');
    expect(host.textContent).toContain('1250');
    expect(host.textContent).toContain('High score');
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

  test('mission briefing explains gameplay and keyboard control settings', async () => {
    await renderApp();
    await click('Mission briefing');

    const dialog = host.querySelector('[role="dialog"][aria-label="Mission Briefing"]');
    const header = dialog?.querySelector('.modal__header');

    expect(dialog).toBeTruthy();
    expect(header?.classList.contains('modal__header--with-icon')).toBe(false);
    expect(dialog?.textContent).toContain('R/F');
    expect(dialog?.textContent).toContain('W/S');
    expect(dialog?.textContent).toContain('Space');
    expect(dialog?.textContent).toContain('Settings → Change Controls');
  });

  test('settings → Change Controls remaps keys, handles conflicts, and restores defaults', async () => {
    await renderApp();
    await click('Settings');
    await click('Change Controls');

    // The mapping lists actions with their default keys.
    const keyFor = (label: string) =>
      Array.from(host.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === `Change key for ${label}`,
      ) ?? null;
    expect(host.textContent).toContain('Slope +');
    expect(keyFor('Slope +')!.textContent).toBe('R');
    expect(keyFor('Face left')!.textContent).toBe('Q');

    // Rebind "Slope +" to a free key.
    await click('Change key for Slope +');
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    });
    expect(keyFor('Slope +')!.textContent).toBe('Z');
    expect(JSON.parse(localStorage.getItem('slope-invaders:keybindings')!).slopeUp).toBe('z');

    // Rebind "Slope +" to a key already used by "Face left" → confirm dialog.
    await click('Change key for Slope +');
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }));
    });
    expect(host.textContent).toContain('Key already used');
    await click('Reassign');
    expect(keyFor('Slope +')!.textContent).toBe('Q');
    expect(keyFor('Face left')!.textContent).toBe('—'); // old owner left unassigned

    // Restore defaults brings everything back in one click.
    await click('Restore Defaults');
    expect(keyFor('Slope +')!.textContent).toBe('R');
    expect(keyFor('Face left')!.textContent).toBe('Q');

    // Escape cancels a pending rebind without closing the modal. (Dispatch from
    // document.body so the capture-phase listener runs before the Modal's Escape.)
    await click('Change key for Face left');
    expect(host.textContent).toContain('Press a key');
    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(host.querySelector('.controls-settings')).toBeTruthy();
    expect(host.textContent).not.toContain('Press a key');
    expect(keyFor('Face left')!.textContent).toBe('Q');

    // Back returns to the audio settings; X still closes.
    await click('← Back');
    expect(host.textContent).toContain('Music Volume');
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

  test('planet view summarizes acquired stars before entering a world', async () => {
    seedCompletedLevels(['tut-1', 'z1-l1']);
    seedLevelStats({
      'z1-l1': levelStats({ levelId: 'z1-l1', misses: 1, heartsLost: 1, heartsRemaining: 4 }),
    });

    await renderApp();
    await click('Play Campaign');

    expect(host.textContent).toContain('1 / 4 missions cleared');
    const status = host.querySelector('dl[aria-label="Campaign navigation status"]');
    expect(status).toBeTruthy();
    expect(status?.textContent).toContain('Missions1/4');
    expect(status?.textContent).toContain('Mastery2/12');
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
    expect(host.querySelectorAll('.surface-banner .star-rating')).toHaveLength(4);
    expect(host.querySelectorAll('.surface-banner .star-rating__star')).toHaveLength(12);
    expect(host.querySelectorAll('.surface-banner--ready')).toHaveLength(1);
    expect(host.querySelectorAll('.surface-banner--ready .star-rating__star--filled')).toHaveLength(0);
    expect(host.querySelectorAll('.surface-banner--locked')).toHaveLength(3);
    expect(host.querySelector('.surface-banner--ready')?.getAttribute('aria-label')).toContain('Steeper Lines');
  });

  test('planet surface marks completed regions and launches active banners directly', async () => {
    seedCompletedLevels(['tut-1', 'z1-l1']);
    seedLevelStats({
      'z1-l1': levelStats({ levelId: 'z1-l1', misses: 1, heartsLost: 1, heartsRemaining: 4 }),
    });
    await renderApp();

    await click('Play Campaign');

    await click('Enter Slope Training');
    await waitForUi();

    expect(host.textContent).toContain('Slope Training');
    expect(host.querySelectorAll('.surface-banner--cleared')).toHaveLength(1);
    expect(host.querySelectorAll('.surface-banner--ready')).toHaveLength(1);
    expect(host.querySelectorAll('.surface-check')).toHaveLength(1);
    expect(host.querySelector('.surface-banner--cleared .star-rating')?.getAttribute('aria-label')).toBe(
      'Steeper Lines stars: 2 of 3 stars',
    );
    expect(host.querySelectorAll('.surface-banner--cleared .star-rating__star--filled')).toHaveLength(2);
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

  test('Pilot Profile opens from the main menu ship button and returns to it', async () => {
    await renderApp();

    await click('Pilot Profile');
    expect(host.textContent).toContain('Cadet'); // starting rank
    expect(host.textContent).toContain('Zone Mastery');
    expect(host.textContent).toContain('Flight Log');
    expect(host.querySelectorAll('.badge-card').length).toBeGreaterThan(0);

    await click('Menu');
    expect(host.textContent).toContain('Choose a Mode');
  });

  test('Pilot Profile opens from the galaxy and returns to it', async () => {
    await renderApp();

    await click('Play Campaign');
    const status = host.querySelector('dl[aria-label="Campaign navigation status"]');
    expect(status?.textContent).toContain('Pilot XP0');

    await click('Pilot Profile');
    expect(host.querySelector('.pilot-card')).toBeTruthy();

    await click('Galaxy');
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

  test('final zone completion routes through debrief into the campaign finale', async () => {
    const completedBeforeFinal = orderedLevels
      .map(({ level }) => level.id)
      .filter((id) => id !== 'z8-l5');
    seedCompletedLevels(completedBeforeFinal);

    await renderApp();
    await click('Play Campaign');
    await click('List view');
    await click('Zone 8: Moving Cannon');
    await click('Final Mastery Check');

    expect(host.textContent).toContain('Playing Final Mastery Check');
    await click('Win mock');

    expect(host.textContent).toContain('Final Debrief');
    expect(host.textContent).toContain('Zone 8 Complete');

    await click('Back to Campaign');
    expect(host.textContent).toContain('You beat Slope Invaders!');
    expect(host.textContent).toContain('Replay Campaign');
    expect(host.textContent).toContain('Back to Menu');
  });
});
