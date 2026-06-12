/**
 * lineMath — pure functions for linear equations of the form y = m·x + b.
 *
 * This module is intentionally free of any rendering or React concerns so it
 * can be unit-tested in isolation and reused by hit detection, hints, etc.
 */
import type { EquationForm } from '../levels/types';

/** A point on the math coordinate plane (y up, as in algebra class). */
export interface Point {
  x: number;
  y: number;
}

/** Evaluate y = m·x + b at a given x. */
export function getYAtX(m: number, b: number, x: number): number {
  return m * x + b;
}

/**
 * Vertical distance between the line y = m·x + b and a point, measured at the
 * point's x. This is the "how far off were you" number students see in
 * feedback: e.g. "your line was at y = 3 but the asteroid was at y = 7".
 */
export function getMissDistance(m: number, b: number, point: Point): number {
  return Math.abs(getYAtX(m, b, point.x) - point.y);
}

/**
 * True when the line passes through the point within `tolerance` (vertical
 * units). Tolerance keeps the game forgiving and matches the feedback model,
 * where "off by ~0" counts as a hit.
 */
export function isPointOnLine(
  m: number,
  b: number,
  point: Point,
  tolerance = 1e-9,
): boolean {
  return getMissDistance(m, b, point) <= tolerance;
}

/**
 * Slope between two points: (y₂ − y₁) / (x₂ − x₁).
 * Returns Infinity for a vertical line (undefined slope) so callers can decide
 * how to present it rather than throwing.
 */
export function calculateSlopeBetweenPoints(a: Point, b: Point): number {
  const dx = b.x - a.x;
  if (dx === 0) return Infinity;
  return (b.y - a.y) / dx;
}

/** Given a slope m and a point on the line, solve for b in y = m·x + b. */
export function calculateInterceptFromPoint(m: number, point: Point): number {
  return point.y - m * point.x;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

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
export function equationString(m: number, b: number, h: number, form: EquationForm): string {
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
