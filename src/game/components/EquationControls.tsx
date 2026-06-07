import { useState } from 'react';
import type { ControlKey, EquationForm } from '../levels/types';

interface EquationControlsProps {
  m: number;
  b: number;
  xOffset: number;
  onChangeM: (value: number) => void;
  onChangeB: (value: number) => void;
  onChangeXOffset: (value: number) => void;
  onFire: () => void;
  onReset: () => void;
  /** Disable inputs/Fire while a shot is animating. */
  disabled: boolean;
  won: boolean;
  controls: ControlKey[];
  equationForm: EquationForm;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** Coefficient prefix for an x-term: 1 -> "", -1 -> "-", else the number. */
function coef(m: number): string {
  if (m === 1) return '';
  if (m === -1) return '-';
  return fmt(m);
}

/**
 * Build the live equation string.
 *   • no x-offset:  y = mx + b           (e.g. "y = x", "y = 2x + 1")
 *   • with offset h: y = m(x - h) + b     (e.g. "y = (x - 3)", "y = 2(x - 3) + 1")
 * The y=mx form hides the intercept.
 */
function equationString(m: number, b: number, h: number, form: EquationForm): string {
  const showB = form !== 'y=mx';

  // Horizontal line: no x term at all.
  if (m === 0) return `y = ${showB ? fmt(b) : '0'}`;

  const xPart =
    h === 0
      ? `${coef(m)}x`
      : `${coef(m)}(x ${h < 0 ? '+' : '-'} ${fmt(Math.abs(h))})`;

  let s = `y = ${xPart}`;
  if (showB && b !== 0) {
    s += ` ${b < 0 ? '-' : '+'} ${fmt(Math.abs(b))}`;
  }
  return s;
}

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
  onChangeM,
  onChangeB,
  onChangeXOffset,
  onFire,
  onReset,
  disabled,
  won,
  controls,
  equationForm,
}: EquationControlsProps) {
  return (
    <div className="controls">
      <div className="controls__equation" aria-live="polite">
        {equationString(m, b, xOffset, equationForm)}
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
            step={1}
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

      <div className="controls__actions">
        <button
          type="button"
          className="btn btn--fire"
          data-button-sfx="none"
          onClick={onFire}
          disabled={disabled || won}
        >
          ▶ Fire
        </button>
        <button type="button" className="btn btn--reset" onClick={onReset}>
          ↺ Reset Level
        </button>
      </div>
    </div>
  );
}
