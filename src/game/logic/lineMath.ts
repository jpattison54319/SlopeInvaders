/**
 * lineMath — pure functions for linear equations of the form y = m·x + b.
 *
 * This module is intentionally free of any rendering or React concerns so it
 * can be unit-tested in isolation and reused by hit detection, hints, etc.
 */
import type { EquationForm } from '../levels/types';
import { formatValue, toRational, type NumberFormat } from './rational';

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

/**
 * A piece of a rendered equation: literal text, or a fraction that the UI can
 * draw as a vertical stack (numerator over a bar over denominator). Fractions
 * only appear in fraction notation; decimal/integer values stay `text`.
 */
export type EquationToken =
  | { kind: 'text'; text: string }
  | { kind: 'frac'; sign: '' | '-'; n: number; d: number };

/** A single coefficient/intercept value as a token in the chosen notation. */
function valueToken(x: number, notation: NumberFormat): EquationToken {
  if (notation === 'fraction' && !Number.isInteger(x)) {
    const { n, d } = toRational(x);
    return n < 0 ? { kind: 'frac', sign: '-', n: -n, d } : { kind: 'frac', sign: '', n, d };
  }
  return { kind: 'text', text: formatValue(x, notation) };
}

/**
 * Break the live equation into render tokens.
 *   • no x-offset:  y = mx + b           (e.g. "y = x", "y = 2x + 1")
 *   • with offset h: y = m(x - h) + b     (e.g. "y = (x - 3)", "y = 2(x - 3) + 1")
 * The y=mx form hides the intercept. `notation` controls fraction vs decimal
 * rendering of the coefficients (defaults to decimal).
 */
export function equationTokens(
  m: number,
  b: number,
  h: number,
  form: EquationForm,
  notation: NumberFormat = 'decimal',
): EquationToken[] {
  const showB = form !== 'y=mx';
  const tokens: EquationToken[] = [{ kind: 'text', text: 'y = ' }];

  // Horizontal line: no x term at all.
  if (m === 0) {
    tokens.push(showB ? valueToken(b, notation) : { kind: 'text', text: '0' });
    return tokens;
  }

  // x-coefficient: 1 -> "", -1 -> "-", else the value.
  if (m === -1) tokens.push({ kind: 'text', text: '-' });
  else if (m !== 1) tokens.push(valueToken(m, notation));

  if (h === 0) {
    tokens.push({ kind: 'text', text: 'x' });
  } else {
    tokens.push({ kind: 'text', text: '(x ' });
    tokens.push({ kind: 'text', text: h < 0 ? '+ ' : '- ' });
    tokens.push(valueToken(Math.abs(h), notation));
    tokens.push({ kind: 'text', text: ')' });
  }

  if (showB && b !== 0) {
    tokens.push({ kind: 'text', text: b < 0 ? ' - ' : ' + ' });
    tokens.push(valueToken(Math.abs(b), notation));
  }
  return tokens;
}

/** Plain-text form of a token (fractions become "n/d"). */
function tokenToString(t: EquationToken): string {
  return t.kind === 'text' ? t.text : `${t.sign}${t.n}/${t.d}`;
}

/** Build the live equation as a single string (used for ARIA + typed-entry readouts). */
export function equationString(
  m: number,
  b: number,
  h: number,
  form: EquationForm,
  notation: NumberFormat = 'decimal',
): string {
  return equationTokens(m, b, h, form, notation).map(tokenToString).join('');
}
