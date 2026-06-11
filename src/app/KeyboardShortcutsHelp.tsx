/**
 * KeyboardShortcutsHelp — accessible overlay listing every in-game keymap.
 *
 * Improvement #8: keyboard-only / screen-reader users can hit `?` (Shift+/)
 * anywhere in the app to see the current bindings, the universal navigation
 * shortcuts, and a link to the full Settings → Change Controls remap screen.
 */
import { useEffect, useRef } from 'react';
import {
  ACTIONS,
  ACTION_LABELS,
  keyLabel,
  type KeyBindings,
} from '../game/controls/keybindings';
import { useFocusTrap } from './useFocusTrap';

interface KeyboardShortcutsHelpProps {
  keyBindings: KeyBindings;
  onClose: () => void;
}

const UNIVERSAL_SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'Tab / Shift+Tab', description: 'Move focus to the next / previous control' },
  { keys: 'Esc', description: 'Close the current dialog or overlay' },
  { keys: '?', description: 'Toggle this shortcuts panel' },
  { keys: 'Enter', description: 'Activate the focused button' },
];

const NAVIGATION_SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'S', description: 'Open Settings (music, SFX, controls) — outside missions' },
  { keys: 'P', description: 'Open Pilot Profile — outside missions' },
];

export function KeyboardShortcutsHelp({ keyBindings, onClose }: KeyboardShortcutsHelpProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true);

  // Always-close handler — Esc works because the focus trap is active.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="shortcuts-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        ref={ref}
        className="shortcuts-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shortcuts-panel__head">
          <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          <button
            type="button"
            className="shortcuts-panel__close"
            aria-label="Close shortcuts"
            onClick={onClose}
            autoFocus
          >
            ✕
          </button>
        </header>

        <section aria-labelledby="shortcuts-gameplay">
          <h3 id="shortcuts-gameplay" className="shortcuts-section__title">
            In-game cannon
          </h3>
          <ul className="shortcuts-list">
            {ACTIONS.map((a) => (
              <li key={a.id} className="shortcuts-list__row">
                <kbd className="shortcuts-list__key">{keyLabel(keyBindings[a.id])}</kbd>
                <span className="shortcuts-list__label">{ACTION_LABELS[a.id]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="shortcuts-nav">
          <h3 id="shortcuts-nav" className="shortcuts-section__title">
            Navigation
          </h3>
          <ul className="shortcuts-list">
            {NAVIGATION_SHORTCUTS.map((s) => (
              <li key={s.keys} className="shortcuts-list__row">
                <kbd className="shortcuts-list__key">{s.keys}</kbd>
                <span className="shortcuts-list__label">{s.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="shortcuts-universal">
          <h3 id="shortcuts-universal" className="shortcuts-section__title">
            Universal
          </h3>
          <ul className="shortcuts-list">
            {UNIVERSAL_SHORTCUTS.map((s) => (
              <li key={s.keys} className="shortcuts-list__row">
                <kbd className="shortcuts-list__key">{s.keys}</kbd>
                <span className="shortcuts-list__label">{s.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="shortcuts-panel__hint">
          Want to remap a key? Open <strong>Settings → Change Controls</strong>.
        </p>
      </div>
      <button
        type="button"
        className="shortcuts-overlay__backdrop"
        aria-label="Close shortcuts"
        onClick={onClose}
        tabIndex={-1}
      />
    </div>
  );
}
