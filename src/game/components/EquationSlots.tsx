import { useState, useEffect, useRef } from 'react';
import type { EquationForm, Facing } from '../levels/types';
import { safeEvaluate, formatResult } from './calc';
import { equationString } from '../logic/lineMath';

interface EquationSlotsProps {
  facing: Facing;
  equationForm: EquationForm;
  onChangeM: (value: number) => void;
  onChangeB: (value: number) => void;
  onChangeXOffset: (value: number) => void;
  onValidityChange: (isValid: boolean) => void;
  disabled: boolean;
}

const ALLOWED_REGEX = /^[0-9./\-\s]*$/;

export function EquationSlots({
  facing,
  equationForm,
  onChangeM,
  onChangeB,
  onChangeXOffset,
  onValidityChange,
  disabled,
}: EquationSlotsProps) {
  const [mText, setMText] = useState('');
  const [bText, setBText] = useState('');
  const [hText, setHText] = useState('');

  const [lastCommitted, setLastCommitted] = useState<{ m?: number; b?: number; h?: number }>({});
  const [filled, setFilled] = useState({ m: false, b: false, h: false });

  const mRef = useRef<HTMLInputElement>(null);
  const hRef = useRef<HTMLInputElement>(null);
  const bRef = useRef<HTMLInputElement>(null);

  const bRequired = equationForm !== 'y=mx';
  const hRequired = equationForm === 'point-slope';

  const isValid =
    filled.m &&
    (!bRequired || filled.b) &&
    (!hRequired || filled.h);

  useEffect(() => {
    onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  const commitM = (text: string) => {
    const parsed = safeEvaluate(text);
    if (parsed !== null) {
      onChangeM(parsed);
      setLastCommitted((prev) => ({ ...prev, m: parsed }));
      setFilled((prev) => ({ ...prev, m: true }));
    } else {
      const revertVal = lastCommitted.m !== undefined ? formatResult(lastCommitted.m) : '';
      setMText(revertVal);
    }
  };

  const commitH = (text: string) => {
    const parsed = safeEvaluate(text);
    if (parsed !== null) {
      onChangeXOffset(parsed);
      setLastCommitted((prev) => ({ ...prev, h: parsed }));
      setFilled((prev) => ({ ...prev, h: true }));
    } else {
      const revertVal = lastCommitted.h !== undefined ? formatResult(lastCommitted.h) : '';
      setHText(revertVal);
    }
  };

  const commitB = (text: string) => {
    const parsed = safeEvaluate(text);
    if (parsed !== null) {
      onChangeB(parsed);
      setLastCommitted((prev) => ({ ...prev, b: parsed }));
      setFilled((prev) => ({ ...prev, b: true }));
    } else {
      const revertVal = lastCommitted.b !== undefined ? formatResult(lastCommitted.b) : '';
      setBText(revertVal);
    }
  };

  const handleMKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const parsed = safeEvaluate(mText);
      if (parsed !== null) {
        onChangeM(parsed);
        setLastCommitted((prev) => ({ ...prev, m: parsed }));
        setFilled((prev) => ({ ...prev, m: true }));
        if (hRef.current) {
          hRef.current.focus();
        } else if (bRef.current) {
          bRef.current.focus();
        }
      }
    }
  };

  const handleHKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const parsed = safeEvaluate(hText);
      if (parsed !== null) {
        onChangeXOffset(parsed);
        setLastCommitted((prev) => ({ ...prev, h: parsed }));
        setFilled((prev) => ({ ...prev, h: true }));
        if (bRef.current) {
          bRef.current.focus();
        }
      }
    }
  };

  const handleBKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const parsed = safeEvaluate(bText);
      if (parsed !== null) {
        onChangeB(parsed);
        setLastCommitted((prev) => ({ ...prev, b: parsed }));
        setFilled((prev) => ({ ...prev, b: true }));
        const fireBtn = document.querySelector('.btn--fire') as HTMLButtonElement | null;
        fireBtn?.focus();
      }
    }
  };

  const mVal = lastCommitted.m ?? null;
  const bVal = bRequired ? (lastCommitted.b ?? null) : 0;
  const hVal = hRequired ? (lastCommitted.h ?? null) : 0;

  const showEcho = mVal !== null && (bVal !== null) && (hVal !== null);
  const shownM = facing === 'left' ? -mVal! : mVal!;

  return (
    <div className="slots-container">
      <div className="slots">
        <span className="slots__text">y = </span>
        <input
          ref={mRef}
          type="text"
          className="slots__input"
          placeholder="m"
          aria-label="slope"
          value={mText}
          disabled={disabled}
          onChange={(e) => {
            const val = e.target.value;
            if (ALLOWED_REGEX.test(val)) {
              setMText(val);
              const parsed = safeEvaluate(val);
              if (parsed !== null) {
                onChangeM(parsed);
                setLastCommitted((prev) => ({ ...prev, m: parsed }));
                setFilled((prev) => ({ ...prev, m: true }));
              } else {
                setFilled((prev) => ({ ...prev, m: false }));
              }
            }
          }}
          onBlur={() => commitM(mText)}
          onKeyDown={handleMKeyDown}
        />

        {equationForm === 'point-slope' ? (
          <>
            <span className="slots__text">( x − </span>
            <input
              ref={hRef}
              type="text"
              className="slots__input"
              placeholder="h"
              aria-label="x-offset"
              value={hText}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                if (ALLOWED_REGEX.test(val)) {
                  setHText(val);
                  const parsed = safeEvaluate(val);
                  if (parsed !== null) {
                    onChangeXOffset(parsed);
                    setLastCommitted((prev) => ({ ...prev, h: parsed }));
                    setFilled((prev) => ({ ...prev, h: true }));
                  } else {
                    setFilled((prev) => ({ ...prev, h: false }));
                  }
                }
              }}
              onBlur={() => commitH(hText)}
              onKeyDown={handleHKeyDown}
            />
            <span className="slots__text"> )</span>
          </>
        ) : (
          <span className="slots__text">x</span>
        )}

        {bRequired && (
          <>
            <span className="slots__text"> + </span>
            <input
              ref={bRef}
              type="text"
              className="slots__input"
              placeholder="b"
              aria-label="y-intercept"
              value={bText}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                if (ALLOWED_REGEX.test(val)) {
                  setBText(val);
                  const parsed = safeEvaluate(val);
                  if (parsed !== null) {
                    onChangeB(parsed);
                    setLastCommitted((prev) => ({ ...prev, b: parsed }));
                    setFilled((prev) => ({ ...prev, b: true }));
                  } else {
                    setFilled((prev) => ({ ...prev, b: false }));
                  }
                }
              }}
              onBlur={() => commitB(bText)}
              onKeyDown={handleBKeyDown}
            />
          </>
        )}
      </div>

      {showEcho && (
        <div className="slots__echo" aria-live="polite">
          Your line: {equationString(shownM, bVal!, hVal!, equationForm)}
        </div>
      )}
    </div>
  );
}
