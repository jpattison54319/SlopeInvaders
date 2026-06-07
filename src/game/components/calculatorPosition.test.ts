import { describe, expect, it } from 'vitest';
import {
  clampCalculatorPosition,
  defaultCalculatorPosition,
  parseCalculatorPosition,
  serializeCalculatorPosition,
} from './calculatorPosition';

describe('calculator position helpers', () => {
  it('clamps a saved position inside the current viewport', () => {
    expect(
      clampCalculatorPosition(
        { x: 900, y: -50 },
        { width: 390, height: 844 },
        { width: 240, height: 322 },
      ),
    ).toEqual({ x: 138, y: 12 });
  });

  it('defaults to the top-right of the board when no saved position exists', () => {
    expect(
      defaultCalculatorPosition(
        { left: 62, top: 180, right: 646, bottom: 764, width: 584, height: 584 },
        { width: 1265, height: 720 },
        { width: 220, height: 364 },
      ),
    ).toEqual({ x: 410, y: 196 });
  });

  it('round-trips a persisted position and ignores invalid saved data', () => {
    const saved = serializeCalculatorPosition({ x: 123.4, y: 456.6 });

    expect(parseCalculatorPosition(saved)).toEqual({ x: 123, y: 457 });
    expect(parseCalculatorPosition('not json')).toBeNull();
    expect(parseCalculatorPosition(JSON.stringify({ x: '12', y: 40 }))).toBeNull();
  });
});
