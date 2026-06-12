import { useState } from 'react';
import type { ControlKey, EquationForm, Facing } from '../levels/types';
import type { UiButtonKey } from '../../assets/assetMap';
import { TacticalButton } from './TacticalButton';
import { EquationSlots } from './EquationSlots';
import { equationString } from '../logic/lineMath';

interface EquationControlsProps {
  m: number;
  b: number;
  xOffset: number;
  facing: Facing;
  onChangeM: (value: number) => void;
  onChangeB: (value: number) => void;
  onChangeXOffset: (value: number) => void;
  onChangeFacing: (value: Facing) => void;
  onFire: () => void;
  onReset: () => void;
  /** Disable inputs/Fire while a shot is animating. */
  disabled: boolean;
  won: boolean;
  controls: ControlKey[];
  equationForm: EquationForm;
  secondaryLabel?: string;
  secondaryText?: string;
  secondaryAsset?: UiButtonKey;
  secondaryClassName?: string;
  entryMode?: 'stepper' | 'typed';
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** Coefficient prefix for an x-term: 1 -> "", -1 -> "-", else the number. */

interface StepperProps {
  label: string;
  symbol: string;
  value: number;
  step: number;
  disabled: boolean;
  onChange: (v: number) => void;
}

/**
 * A numeric control the student can drive two ways: the +/− buttons for quick
 * nudges, or by typing a value directly (decimals like 0.5 and negatives like
 * -1 included). Typing is backed by local text state so intermediate entries
 * ("", "-", "0.") don't get clobbered mid-edit.
 */
function Stepper({ label, symbol, value, step, disabled, onChange }: StepperProps) {
  const [draft, setDraft] = useState(() => ({ text: fmt(value), numericValue: value }));
  const round = (v: number) => Math.round(v * 100) / 100;
  const text = draft.numericValue === value ? draft.text : fmt(value);

  const handleType = (raw: string) => {
    // Permit only number-ish input, including in-progress states.
    if (raw !== '' && !/^-?\d*\.?\d*$/.test(raw)) return;
    const v = parseFloat(raw);
    if (Number.isFinite(v)) {
      setDraft({ text: raw, numericValue: v });
      onChange(v); // commit valid numbers live
    } else {
      setDraft({ text: raw, numericValue: value });
    }
  };

  const handleBlur = () => {
    // Normalize on blur; revert to the last value if the field is incomplete.
    const v = parseFloat(text);
    const next = Number.isFinite(v) ? round(v) : value;
    onChange(next);
    setDraft({ text: fmt(next), numericValue: next });
  };

  const bump = (delta: number) => {
    const next = round(value + delta);
    onChange(next);
    setDraft({ text: fmt(next), numericValue: next });
  };

  return (
    <div className="stepper">
      <label className="stepper__label">
        <span className="stepper__symbol">{symbol}</span> {label}
      </label>
      <div className="stepper__row">
        <button
          type="button"
          className="stepper__btn"
          aria-label={`Decrease ${label}`}
          disabled={disabled}
          onClick={() => bump(-step)}
        >
          −
        </button>
        <input
          className="stepper__input"
          type="text"
          inputMode="decimal"
          aria-label={label}
          value={text}
          disabled={disabled}
          onChange={(e) => handleType(e.target.value)}
          onBlur={handleBlur}
        />
        <button
          type="button"
          className="stepper__btn"
          aria-label={`Increase ${label}`}
          disabled={disabled}
          onClick={() => bump(step)}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Slope / y-intercept / x-offset controls, the live equation, and Fire / Reset. */
export function EquationControls({
  m,
  b,
  xOffset,
  facing,
  onChangeM,
  onChangeB,
  onChangeXOffset,
  onChangeFacing,
  onFire,
  onReset,
  disabled,
  won,
  controls,
  equationForm,
  secondaryLabel = 'Reset Level',
  secondaryText = 'Reset Level',
  secondaryAsset = 'replay',
  secondaryClassName = 'btn--reset',
  entryMode = 'stepper',
}: EquationControlsProps) {
  const [slotsValid, setSlotsValid] = useState(false);

  // Facing left mirrors the line across the ship, so the equation (and the
  // dashed aim line it matches) shows the negated slope while the slope stepper
  // keeps showing the value the player dialed.
  const shownM = controls.includes('direction') && facing === 'left' ? -m : m;
  return (
    <div className="controls" data-tour="command">
      {entryMode === 'typed' ? (
        <EquationSlots
          facing={facing}
          equationForm={equationForm}
          onChangeM={onChangeM}
          onChangeB={onChangeB}
          onChangeXOffset={onChangeXOffset}
          onValidityChange={setSlotsValid}
          disabled={disabled}
        />
      ) : (
        <>
          <div className="controls__equation" aria-live="polite">
            {equationString(shownM, b, xOffset, equationForm)}
          </div>

          <div className="controls__steppers">
            {controls.includes('slope') && (
              <Stepper
                label="slope"
                symbol="m"
                value={m}
                step={0.5}
                disabled={disabled}
                onChange={onChangeM}
              />
            )}
            {controls.includes('yIntercept') && equationForm !== 'y=mx' && (
              <Stepper
                label="y-intercept"
                symbol="b"
                value={b}
                step={0.5}
                disabled={disabled}
                onChange={onChangeB}
              />
            )}
            {/* Movable cannon — unlocked in later levels (not Level 1). */}
            {controls.includes('xOffset') && (
              <Stepper
                label="x-offset"
                symbol="Δx"
                value={xOffset}
                step={1}
                disabled={disabled}
                onChange={onChangeXOffset}
              />
            )}
          </div>
        </>
      )}

      {/* Facing direction — the shot fires only this way (Zone 4). */}
      {controls.includes('direction') && (
        <div className="direction-toggle">
          <span className="direction-toggle__label">facing</span>
          <div className="direction-toggle__buttons">
            <button
              type="button"
              className={`direction-btn ${facing === 'left' ? 'direction-btn--active' : ''}`}
              aria-label="Face left"
              aria-pressed={facing === 'left'}
              disabled={disabled}
              onClick={() => onChangeFacing('left')}
            >
              ◀ Left
            </button>
            <button
              type="button"
              className={`direction-btn ${facing === 'right' ? 'direction-btn--active' : ''}`}
              aria-label="Face right"
              aria-pressed={facing === 'right'}
              disabled={disabled}
              onClick={() => onChangeFacing('right')}
            >
              Right ▶
            </button>
          </div>
        </div>
      )}

      <div className="controls__actions">
        <TacticalButton
          asset="play"
          label="Fire"
          text="Fire"
          size="large"
          className="btn btn--fire btn--split"
          data-button-sfx="none"
          onClick={onFire}
          disabled={disabled || won || (entryMode === 'typed' && !slotsValid)}
        />
        <TacticalButton
          asset={secondaryAsset}
          label={secondaryLabel}
          text={secondaryText}
          size="large"
          className={`btn ${secondaryClassName} btn--split`}
          onClick={onReset}
        />
      </div>
    </div>
  );
}
