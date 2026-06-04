import { describe, it, expect } from 'vitest';
import {
  getYAtX,
  isPointOnLine,
  getMissDistance,
  calculateSlopeBetweenPoints,
  calculateInterceptFromPoint,
} from './lineMath';

describe('getYAtX', () => {
  it('evaluates y = mx + b', () => {
    expect(getYAtX(2, 1, 3)).toBe(7); // 2*3 + 1
    expect(getYAtX(0.5, 0, 6)).toBe(3); // fractional slope
    expect(getYAtX(-1, 4, 4)).toBe(0); // negative slope
  });
});

describe('isPointOnLine', () => {
  it('reports a hit when the line passes through the point', () => {
    // y = x passes through (4, 4)
    expect(isPointOnLine(1, 0, { x: 4, y: 4 })).toBe(true);
    // y = 0.5x passes through (6, 3)
    expect(isPointOnLine(0.5, 0, { x: 6, y: 3 })).toBe(true);
  });

  it('reports a miss when the point is off the line', () => {
    // y = x at x=5 gives 5, not 7
    expect(isPointOnLine(1, 0, { x: 5, y: 7 })).toBe(false);
  });

  it('respects the tolerance window', () => {
    // off by 0.2, tolerance 0.35 -> hit
    expect(isPointOnLine(1, 0, { x: 3, y: 3.2 }, 0.35)).toBe(true);
    // off by 0.2, tolerance 0.1 -> miss
    expect(isPointOnLine(1, 0, { x: 3, y: 3.2 }, 0.1)).toBe(false);
  });
});

describe('getMissDistance', () => {
  it('measures the vertical distance from the line to the point', () => {
    // y = x at x=5 is 5; point is at y=7 -> off by 2
    expect(getMissDistance(1, 0, { x: 5, y: 7 })).toBe(2);
    // exact hit -> 0
    expect(getMissDistance(2, 1, { x: 3, y: 7 })).toBe(0);
  });
});

describe('calculateSlopeBetweenPoints', () => {
  it('computes rise over run', () => {
    expect(calculateSlopeBetweenPoints({ x: 0, y: 0 }, { x: 2, y: 4 })).toBe(2);
    expect(calculateSlopeBetweenPoints({ x: 1, y: 1 }, { x: 3, y: 0 })).toBe(-0.5);
  });

  it('returns Infinity for a vertical line', () => {
    expect(calculateSlopeBetweenPoints({ x: 2, y: 1 }, { x: 2, y: 5 })).toBe(Infinity);
  });
});

describe('calculateInterceptFromPoint', () => {
  it('solves b = y - mx', () => {
    // line through (3, 7) with slope 2 -> b = 1
    expect(calculateInterceptFromPoint(2, { x: 3, y: 7 })).toBe(1);
    // line through the origin -> b = 0
    expect(calculateInterceptFromPoint(5, { x: 0, y: 0 })).toBe(0);
  });
});
