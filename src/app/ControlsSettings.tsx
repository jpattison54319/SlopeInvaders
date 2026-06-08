import { useEffect, useState } from 'react';
import {
  ACTIONS,
  ACTION_LABELS,
  DEFAULT_KEYBINDINGS,
  findActionForKey,
  keyLabel,
  normalizeKey,
  reassignKey,
  type GameAction,
  type KeyBindings,
} from '../game/controls/keybindings';

interface ControlsSettingsProps {
  keyBindings: KeyBindings;
  onChange: (next: KeyBindings) => void;
  onBack: () => void;
}

interface Conflict {
  action: GameAction;
  key: string;
  conflictAction: GameAction;
}

/** Settings sub-screen: a two-column key map the player can rebind. */
export function ControlsSettings({ keyBindings, onChange, onBack }: ControlsSettingsProps) {
  const [listening, setListening] = useState<GameAction | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);

  // While listening for a key, capture the next keypress. Use the capture phase
  // + stopImmediatePropagation so the press never reaches the Modal's
  // Escape-to-close handler (Escape just cancels the rebind here).
  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.key === 'Escape') {
        setListening(null);
        return;
      }
      const key = normalizeKey(e);
      const owner = findActionForKey(keyBindings, key);
      if (owner && owner !== listening) {
        setConflict({ action: listening, key, conflictAction: owner });
        setListening(null);
        return;
      }
      onChange(reassignKey(keyBindings, listening, key));
      setListening(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listening, keyBindings, onChange]);

  const confirmReassign = () => {
    if (!conflict) return;
    onChange(reassignKey(keyBindings, conflict.action, conflict.key));
    setConflict(null);
  };

  return (
    <div className="controls-settings">
      <div className="controls-settings__top">
        <button type="button" className="controls-settings__back" onClick={onBack}>
          ← Back
        </button>
        <p className="controls-settings__hint">
          Click a key, then press the key you want for that action. Keys control the cannon during a
          level.
        </p>
      </div>

      <div className="controls-settings__list">
        {ACTIONS.map((action) => (
          <div className="keybind-row" key={action.id}>
            <span className="keybind-row__label">{action.label}</span>
            <button
              type="button"
              className={`keybind-key ${listening === action.id ? 'keybind-key--listening' : ''}`}
              aria-label={`Change key for ${action.label}`}
              onClick={() => setListening(action.id)}
            >
              {listening === action.id ? 'Press a key…' : keyLabel(keyBindings[action.id])}
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--reset controls-settings__restore"
        onClick={() => onChange(DEFAULT_KEYBINDINGS)}
      >
        ↺ Restore Defaults
      </button>

      {conflict && (
        <div className="keybind-confirm" role="dialog" aria-label="Reassign key">
          <div className="keybind-confirm__panel">
            <strong>Key already used</strong>
            <p>
              <kbd>{keyLabel(conflict.key)}</kbd> is assigned to{' '}
              <strong>{ACTION_LABELS[conflict.conflictAction]}</strong>. Reassign it? The old action
              will be left unassigned.
            </p>
            <div className="keybind-confirm__actions">
              <button type="button" className="btn btn--fire" onClick={confirmReassign}>
                Reassign
              </button>
              <button type="button" className="btn btn--reset" onClick={() => setConflict(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
