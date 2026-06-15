import { Modal } from './Modal';
import { HelpIcon } from './HelpIcon';
import { conceptHelpForZone } from '../campaign/conceptHelp';
import { ACTIONS, keyLabel, type KeyBindings } from '../controls/keybindings';
import type { ControlKey } from '../levels/types';

interface HelpDrawerProps {
  /** The level's learning goal (objective recap). */
  objective: string;
  levelNumberLabel: string;
  title: string;
  /** Zone id for the matching math refresher. */
  zoneId: string;
  /** Controls active on this level (gates the keyboard list). */
  allowedControls: ControlKey[];
  keyBindings: KeyBindings;
  /** Re-run the first-visit guided walkthrough. */
  onReplayTour: () => void;
  onClose: () => void;
}

/**
 * Always-available, free help-seeking surface (docs/agent/01 SRL, 04). Three
 * sections: this mission (objective + tour replay), a per-zone math refresher,
 * and controls/tech help. Opening it never affects score or adaptivity.
 */
export function HelpDrawer({
  objective,
  levelNumberLabel,
  title,
  zoneId,
  allowedControls,
  keyBindings,
  onReplayTour,
  onClose,
}: HelpDrawerProps) {
  const concept = conceptHelpForZone(zoneId);
  // Fire always works; other actions only when the level enables their control.
  const keyRows = ACTIONS.filter((a) => !a.control || allowedControls.includes(a.control));

  return (
    <Modal title="Help & Support" iconNode={<HelpIcon />} onClose={onClose}>
      <div className="help-drawer">
        <section className="help-drawer__section">
          <h3 className="help-drawer__heading">This mission</h3>
          <p className="help-drawer__level">{levelNumberLabel} · {title}</p>
          <p className="help-drawer__objective">{objective}</p>
          <button type="button" className="help-drawer__action" onClick={onReplayTour}>
            ▶ Replay the walkthrough
          </button>
        </section>

        <section className="help-drawer__section">
          <h3 className="help-drawer__heading">Math refresher — {concept.title}</h3>
          <ul className="help-drawer__list">
            {concept.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="help-drawer__section">
          <h3 className="help-drawer__heading">Controls &amp; tech</h3>
          <ul className="help-drawer__keys">
            {keyRows.map((a) => (
              <li key={a.id}>
                <span>{a.label}</span>
                <kbd>{keyLabel(keyBindings[a.id])}</kbd>
              </li>
            ))}
          </ul>
          <ul className="help-drawer__list">
            <li>Need to do slope math? Open the <strong>Calculator</strong> — it never costs you score.</li>
            <li>Stuck on a shot? The <strong>Hint</strong> button coaches your current aim.</li>
            <li>Change audio or remap keys in <strong>Settings</strong>; <strong>Reset Level</strong> starts over any time.</li>
          </ul>
        </section>
      </div>
    </Modal>
  );
}
