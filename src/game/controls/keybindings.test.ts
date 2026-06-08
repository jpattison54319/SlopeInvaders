import { describe, it, expect } from 'vitest';
import {
  ACTIONS,
  DEFAULT_KEYBINDINGS,
  findActionForKey,
  keyLabel,
  reassignKey,
  withDefaults,
  type KeyBindings,
} from './keybindings';

describe('keybindings defaults', () => {
  it('binds all actions to the documented defaults', () => {
    expect(DEFAULT_KEYBINDINGS).toEqual({
      fire: ' ',
      slopeUp: 'r',
      slopeDown: 'f',
      yInterceptUp: 'w',
      yInterceptDown: 's',
      xOffsetUp: 'd',
      xOffsetDown: 'a',
      faceLeft: 'q',
      faceRight: 'e',
    });
    expect(ACTIONS.map((a) => a.id).sort()).toEqual(
      (Object.keys(DEFAULT_KEYBINDINGS) as string[]).sort(),
    );
  });
});

describe('findActionForKey', () => {
  it('finds the owning action, or null', () => {
    expect(findActionForKey(DEFAULT_KEYBINDINGS, 'r')).toBe('slopeUp');
    expect(findActionForKey(DEFAULT_KEYBINDINGS, 'q')).toBe('faceLeft');
    expect(findActionForKey(DEFAULT_KEYBINDINGS, 'z')).toBeNull();
  });
});

describe('reassignKey', () => {
  it('assigns a free key without disturbing others', () => {
    const next = reassignKey(DEFAULT_KEYBINDINGS, 'slopeUp', 'z');
    expect(next.slopeUp).toBe('z');
    expect(next.slopeDown).toBe('f');
  });

  it('clears the conflicting action when a used key is reassigned', () => {
    // 'q' currently belongs to faceLeft; give it to slopeUp.
    const next = reassignKey(DEFAULT_KEYBINDINGS, 'slopeUp', 'q');
    expect(next.slopeUp).toBe('q');
    expect(next.faceLeft).toBeNull(); // old owner left unassigned
  });

  it('is a no-op-equivalent when reassigning an action to its own key', () => {
    const next = reassignKey(DEFAULT_KEYBINDINGS, 'slopeUp', 'r');
    expect(next.slopeUp).toBe('r');
    expect(next).toEqual(DEFAULT_KEYBINDINGS);
  });
});

describe('keyLabel', () => {
  it('renders friendly labels', () => {
    expect(keyLabel(null)).toBe('—');
    expect(keyLabel('r')).toBe('R');
    expect(keyLabel(' ')).toBe('Space');
    expect(keyLabel('ArrowUp')).toBe('↑');
  });
});

describe('withDefaults', () => {
  it('fills missing actions from defaults', () => {
    const partial = { slopeUp: 'z' } as Partial<KeyBindings>;
    const merged = withDefaults(partial);
    expect(merged.slopeUp).toBe('z');
    expect(merged.faceRight).toBe('e');
    expect(withDefaults(null)).toEqual(DEFAULT_KEYBINDINGS);
  });
});
