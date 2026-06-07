import { describe, expect, it } from 'vitest';
import { formatResult, safeEvaluate } from './calc';

describe('safeEvaluate', () => {
  it('computes a slope expression with correct precedence', () => {
    expect(safeEvaluate('(6-2)/(3-1)')).toBe(2);
    expect(safeEvaluate('2*3+1')).toBe(7);
  });

  it('maps the display operators × ÷ −', () => {
    expect(safeEvaluate('6−2')).toBe(4);
    expect(safeEvaluate('3×4')).toBe(12);
    expect(safeEvaluate('8÷2')).toBe(4);
  });

  it('returns null for empty or invalid input', () => {
    expect(safeEvaluate('')).toBeNull();
    expect(safeEvaluate('   ')).toBeNull();
    expect(safeEvaluate('(6-2')).toBeNull();
    expect(safeEvaluate('abc')).toBeNull();
  });

  it('returns null for non-finite results (e.g. ÷0)', () => {
    expect(safeEvaluate('1/0')).toBeNull();
  });
});

describe('formatResult', () => {
  it('keeps integers clean and rounds long decimals', () => {
    expect(formatResult(2)).toBe('2');
    expect(formatResult(1 / 3)).toBe('0.333333');
  });
});
