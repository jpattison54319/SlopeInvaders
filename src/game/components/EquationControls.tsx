import { useState } from 'react';
import type { ControlKey, EquationForm, Facing } from '../levels/types';
import type { UiButtonKey } from '../../assets/assetMap';
import { TacticalButton } from './TacticalButton';
import { EquationSlots } from './EquationSlots';
import { EquationView, StackedFraction } from './EquationView';
import { equationString } from '../logic/lineMath';
import {
  detectFormat,
  formatValue,
  isPartialNumberEntry,
  parseValue,
  type NumberFormat,
} from '../logic/rational';
import { DEFAULT_KEYBINDINGS, keyLabel, type KeyBindings } from '../controls/keybindings';

/** Display label for an action's bound key, or undefined when unassigned. */
function hint(bindings: KeyBindings, action: keyof KeyBindings): string | undefined {
  const label = keyLabel(bindings[action]);
  return label === '—' ? undefined : label;
}

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
  /** Current key map, used to print each control's shortcut on its button. */
  keyBindings?: KeyBindings;
  /** Fraction vs decimal notation for slope / y-intercept display and entry. */
  notation: NumberFormat;
  onChangeNotation: (value: NumberFormat) => void;
}

interface StepperProps {
  label: string;
  symbol: string;
  value: number;
  step: number;
  disabled: boolean;
  notation: NumberFormat;
  onChange: (v: number) => void;
  /** Called when the typed text reveals a notation preference (e.g. "1/2"). */
  onDetectFormat: (value: NumberFormat) => void;
  /** Keyboard-shortcut labels for the −/+ buttons (mouse devices only). */
  decKey?: string;
  incKey?: string;
}

/**
 * A numeric control the student can drive two ways: the +/− buttons for quick
 * nudges, or by typing a value directly — fractions ("1/2", "-3/4"), decimals
 * (".5"), and negatives all welcome. While the field is focused we show the raw
 * draft so mid-edit entries ("", "-", "1/") aren't clobbered; otherwise we
 * render the committed value in the active notation.
 */
function Stepper({
  label,
  symbol,
  value,
  step,
  disabled,
  notation,
  onChange,
  onDetectFormat,
  decKey,
  incKey,
}: StepperProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  // Keep enough precision to recover typed fractions (1/3) while killing float drift.
  const round = (v: number) => Math.round(v * 1e6) / 1e6;
  const text = focused ? draft : formatValue(value, notation);

  const handleType = (raw: string) => {
    // Permit only number-ish input, including in-progress states.
    if (raw !== '' && !isPartialNumberEntry(raw)) return;
    setDraft(raw);
    const detected = detectFormat(raw);
    if (detected) onDetectFormat(detected); // follow the student's chosen style
    const v = parseValue(raw);
    if (v !== null) onChange(round(v)); // commit valid numbers live
  };

  const handleFocus = () => {
    setDraft(formatValue(value, notation));
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    const v = parseValue(draft);
    if (v !== null) onChange(round(v));
  };

  const bump = (delta: number) => {
    onChange(round(value + delta));
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
          {decKey && <kbd className="key-hint">{decKey}</kbd>}
        </button>
        <input
          className="stepper__input"
          type="text"
          inputMode="text"
          aria-label={label}
          value={text}
          disabled={disabled}
          onFocus={handleFocus}
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
          {incKey && <kbd className="key-hint">{incKey}</kbd>}
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
  keyBindings = DEFAULT_KEYBINDINGS,
  notation,
  onChangeNotation,
}: EquationControlsProps) {
  const [slotsValid, setSlotsValid] = useState(false);

  // Facing left mirrors the line across the ship, so the equation (and the
  // dashed aim line it matches) shows the negated slope while the slope stepper
  // keeps showing the value the player dialed.
  const shownM = controls.includes('direction') && facing === 'left' ? -m : m;
  // Notation only matters where a value can be fractional (slope / y-intercept).
  const showNotationToggle = controls.includes('slope') || controls.includes('yIntercept');
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
          <div className="controls__equation-row">
            <div className="controls__equation" aria-live="polite">
              <span className="visually-hidden">
                {equationString(shownM, b, xOffset, equationForm, notation)}
              </span>
              <span aria-hidden="true">
                <EquationView m={shownM} b={b} h={xOffset} form={equationForm} notation={notation} />
              </span>
            </div>
            {showNotationToggle && (
              <button
                type="button"
                className={`notation-toggle notation-toggle--${notation}`}
                data-tour="notation"
                title={
                  notation === 'fraction'
                    ? 'Showing fractions — switch to decimals'
                    : 'Showing decimals — switch to fractions'
                }
                aria-label={`Number format: ${notation}. Switch to ${
                  notation === 'fraction' ? 'decimals' : 'fractions'
                }.`}
                aria-pressed={notation === 'fraction'}
                disabled={disabled}
                onClick={() => onChangeNotation(notation === 'fraction' ? 'decimal' : 'fraction')}
              >
                {notation === 'fraction' ? (
                  <StackedFraction n={1} d={2} />
                ) : (
                  <span className="notation-toggle__decimal" aria-hidden="true">
                    0.5
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="controls__steppers">
            {controls.includes('slope') && (
              <Stepper
                label="slope"
                symbol="m"
                value={m}
                step={0.5}
                disabled={disabled}
                notation={notation}
                onChange={onChangeM}
                onDetectFormat={onChangeNotation}
                decKey={hint(keyBindings, 'slopeDown')}
                incKey={hint(keyBindings, 'slopeUp')}
              />
            )}
            {controls.includes('yIntercept') && equationForm !== 'y=mx' && (
              <Stepper
                label="y-intercept"
                symbol="b"
                value={b}
                step={0.5}
                disabled={disabled}
                notation={notation}
                onChange={onChangeB}
                onDetectFormat={onChangeNotation}
                decKey={hint(keyBindings, 'yInterceptDown')}
                incKey={hint(keyBindings, 'yInterceptUp')}
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
                notation={notation}
                onChange={onChangeXOffset}
                onDetectFormat={onChangeNotation}
                decKey={hint(keyBindings, 'xOffsetDown')}
                incKey={hint(keyBindings, 'xOffsetUp')}
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
              {hint(keyBindings, 'faceLeft') && (
                <kbd className="key-hint">{hint(keyBindings, 'faceLeft')}</kbd>
              )}
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
              {hint(keyBindings, 'faceRight') && (
                <kbd className="key-hint">{hint(keyBindings, 'faceRight')}</kbd>
              )}
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
          keyHint={hint(keyBindings, 'fire')}
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
