import { describe, expect, it } from 'vitest';
import {
  detectFormat,
  formatValue,
  isPartialNumberEntry,
  parseValue,
  toRational,
} from './rational';

describe('toRational', () => {
  it('recovers clean fractions from control float values', () => {
    expect(toRational(0.5)).toEqual({ n: 1, d: 2 });
    expect(toRational(0.75)).toEqual({ n: 3, d: 4 });
    expect(toRational(0.25)).toEqual({ n: 1, d: 4 });
    expect(toRational(1 / 3)).toEqual({ n: 1, d: 3 });
    expect(toRational(2 / 3)).toEqual({ n: 2, d: 3 });
    expect(toRational(5 / 6)).toEqual({ n: 5, d: 6 });
  });

  it('keeps improper fractions (slope convention, not mixed numbers)', () => {
    expect(toRational(1.5)).toEqual({ n: 3, d: 2 });
    expect(toRational(2.5)).toEqual({ n: 5, d: 2 });
  });

  it('handles integers, negatives, and zero', () => {
    expect(toRational(2)).toEqual({ n: 2, d: 1 });
    expect(toRational(-0.5)).toEqual({ n: -1, d: 2 });
    expect(toRational(-0.75)).toEqual({ n: -3, d: 4 });
    expect(toRational(0)).toEqual({ n: 0, d: 1 });
  });
});

describe('formatValue', () => {
  it('renders fractions in fraction mode', () => {
    expect(formatValue(0.5, 'fraction')).toBe('1/2');
    expect(formatValue(0.75, 'fraction')).toBe('3/4');
    expect(formatValue(1.5, 'fraction')).toBe('3/2');
    expect(formatValue(-0.5, 'fraction')).toBe('-1/2');
    expect(formatValue(1 / 3, 'fraction')).toBe('1/3');
  });

  it('renders rounded decimals in decimal mode', () => {
    expect(formatValue(0.5, 'decimal')).toBe('0.5');
    expect(formatValue(0.75, 'decimal')).toBe('0.75');
    expect(formatValue(1 / 3, 'decimal')).toBe('0.33');
  });

  it('renders integers the same in both modes (and never -0)', () => {
    expect(formatValue(2, 'fraction')).toBe('2');
    expect(formatValue(2, 'decimal')).toBe('2');
    expect(formatValue(-0, 'fraction')).toBe('0');
    expect(formatValue(0, 'decimal')).toBe('0');
  });
});

describe('parseValue', () => {
  it('accepts fractions, decimals, and integers', () => {
    expect(parseValue('1/2')).toBe(0.5);
    expect(parseValue('-3/4')).toBe(-0.75);
    expect(parseValue('.5')).toBe(0.5);
    expect(parseValue('0.75')).toBe(0.75);
    expect(parseValue('2')).toBe(2);
    expect(parseValue('-1')).toBe(-1);
  });

  it('rejects invalid input and division by zero', () => {
    expect(parseValue('')).toBeNull();
    expect(parseValue('1/0')).toBeNull();
    expect(parseValue('abc')).toBeNull();
    expect(parseValue('1/2/3')).toBeNull();
  });

  it('round-trips typed fractions back to the same display', () => {
    const v = parseValue('3/4');
    expect(v).not.toBeNull();
    expect(formatValue(v as number, 'fraction')).toBe('3/4');
  });
});

describe('detectFormat', () => {
  it('infers fraction from a slash and decimal from a dot', () => {
    expect(detectFormat('1/2')).toBe('fraction');
    expect(detectFormat('0.5')).toBe('decimal');
    expect(detectFormat('.5')).toBe('decimal');
  });

  it('leaves a bare integer ambiguous', () => {
    expect(detectFormat('2')).toBeNull();
    expect(detectFormat('-3')).toBeNull();
  });
});

describe('isPartialNumberEntry', () => {
  it('permits in-progress fraction and decimal entries', () => {
    for (const t of ['', '-', '1.', '.', '0.5', '1/', '-1/2', '3/4', '-3']) {
      expect(isPartialNumberEntry(t)).toBe(true);
    }
  });

  it('rejects clearly invalid entries', () => {
    for (const t of ['abc', '1/2/3', '1..2', '/']) {
      expect(isPartialNumberEntry(t)).toBe(false);
    }
  });
});
