/**
 * Keyboard controls for gameplay: the action set, default bindings, and pure
 * helpers for remapping. The bindings are persisted (see usePersistentState) and
 * editable in Settings → Change Controls. Each action maps to a single key and is
 * gated in-game by the level's allowedControls (via `control`).
 */
import type { ControlKey } from '../levels/types';

export type GameAction =
  | 'fire'
  | 'slopeUp'
  | 'slopeDown'
  | 'yInterceptUp'
  | 'yInterceptDown'
  | 'xOffsetUp'
  | 'xOffsetDown'
  | 'faceLeft'
  | 'faceRight';

/** action → key. null means the action currently has no key (after a reassign). */
export type KeyBindings = Record<GameAction, string | null>;

export const KEYBINDINGS_KEY = 'slope-invaders:keybindings';

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  fire: ' ',
  slopeUp: 'r',
  slopeDown: 'f',
  yInterceptUp: 'w',
  yInterceptDown: 's',
  xOffsetUp: 'd',
  xOffsetDown: 'a',
  faceLeft: 'q',
  faceRight: 'e',
};

/**
 * UI order + labels + which level control gates each action in-game. `control`
 * is omitted for actions that aren't tied to a control (e.g. Fire always works).
 */
export const ACTIONS: { id: GameAction; label: string; control?: ControlKey }[] = [
  { id: 'fire', label: 'Fire' },
  { id: 'slopeUp', label: 'Slope +', control: 'slope' },
  { id: 'slopeDown', label: 'Slope −', control: 'slope' },
  { id: 'yInterceptUp', label: 'Y-intercept +', control: 'yIntercept' },
  { id: 'yInterceptDown', label: 'Y-intercept −', control: 'yIntercept' },
  { id: 'xOffsetUp', label: 'X-offset +', control: 'xOffset' },
  { id: 'xOffsetDown', label: 'X-offset −', control: 'xOffset' },
  { id: 'faceLeft', label: 'Face left', control: 'direction' },
  { id: 'faceRight', label: 'Face right', control: 'direction' },
];

export const ACTION_LABELS: Record<GameAction, string> = ACTIONS.reduce(
  (acc, a) => {
    acc[a.id] = a.label;
    return acc;
  },
  {} as Record<GameAction, string>,
);

/** Normalize a KeyboardEvent to the stored key form (single chars lowercased). */
export function normalizeKey(e: KeyboardEvent): string {
  return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

/** Human-readable label for a stored key (or "—" when unassigned). */
export function keyLabel(key: string | null): string {
  if (!key) return '—';
  if (key === ' ') return 'Space';
  const arrows: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
  };
  if (arrows[key]) return arrows[key];
  return key.length === 1 ? key.toUpperCase() : key;
}

/** Which action (if any) currently owns this key. */
export function findActionForKey(bindings: KeyBindings, key: string): GameAction | null {
  return (Object.keys(bindings) as GameAction[]).find((a) => bindings[a] === key) ?? null;
}

/**
 * Assign `key` to `action`, clearing it from whatever other action held it (that
 * action is left unassigned, per the reassign rule).
 */
export function reassignKey(bindings: KeyBindings, action: GameAction, key: string): KeyBindings {
  const next: KeyBindings = { ...bindings };
  for (const a of Object.keys(next) as GameAction[]) {
    if (next[a] === key) next[a] = null;
  }
  next[action] = key;
  return next;
}

/** Merge stored bindings over defaults so missing/added actions stay valid. */
export function withDefaults(bindings: Partial<KeyBindings> | null | undefined): KeyBindings {
  return { ...DEFAULT_KEYBINDINGS, ...(bindings ?? {}) };
}
