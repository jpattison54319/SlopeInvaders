/**
 * Number-format helpers for slope (and y-intercept) display/entry.
 *
 * Slope is rise-over-run — natively a fraction — but the game stores it as a
 * plain number so hit detection / scoring stay numeric. These pure helpers let
 * the UI show and accept that number in whichever notation a student prefers,
 * without ever changing the underlying value. Nothing here affects scoring or
 * adaptivity; it is purely presentation + parsing.
 */

export type NumberFormat = 'fraction' | 'decimal';

const EPS = 1e-9;

/** Greatest common divisor (positive integers). */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Best lowest-terms rational approximation of `x` with denominator ≤ `maxDenom`,
 * via continued fractions. Recovers clean fractions from the float values the
 * controls produce (0.5 → 1/2, 0.75 → 3/4, 0.3333… → 1/3, 0.8333… → 5/6).
 */
export function toRational(x: number, maxDenom = 64): { n: number; d: number } {
  if (!Number.isFinite(x)) return { n: 0, d: 1 };
  const sign = x < 0 ? -1 : 1;
  let value = Math.abs(x);

  // Continued-fraction expansion, tracking the two latest convergents.
  let h0 = 0;
  let h1 = 1;
  let k0 = 1;
  let k1 = 0;
  let a = Math.floor(value);
  let frac = value - a;

  // First convergent.
  let n = a;
  let d = 1;

  while (true) {
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDenom) break;
    h0 = h1;
    h1 = h2;
    k0 = k1;
    k1 = k2;
    n = h2;
    d = k2;
    if (frac < EPS) break;
    value = 1 / frac;
    a = Math.floor(value);
    frac = value - a;
  }

  if (d === 0) d = 1;
  const g = gcd(n, d) || 1;
  return { n: (sign * n) / g, d: d / g };
}

/** Decimal display: integers stay whole, others round to 2 places (no -0). */
function formatDecimal(x: number): string {
  const rounded = Number.isInteger(x) ? x : Math.round(x * 100) / 100;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

/**
 * Format a value for display in the chosen notation. Integers render the same in
 * both modes; non-integers render as a lowest-terms (improper) fraction like
 * "3/2" in fraction mode or a rounded decimal in decimal mode.
 */
export function formatValue(x: number, mode: NumberFormat): string {
  if (Number.isInteger(x)) return String(Object.is(x, -0) ? 0 : x);
  if (mode === 'decimal') return formatDecimal(x);
  const { n, d } = toRational(x);
  if (d === 1) return String(n);
  return `${n}/${d}`;
}

/**
 * Parse user-typed text into a number, accepting fractions ("1/2", "-3/4"),
 * decimals (".5", "0.75"), and integers. Returns null for empty/invalid input
 * (including division by zero) so callers can keep the prior value.
 */
export function parseValue(text: string): number | null {
  const t = text.trim();
  if (t === '') return null;

  const fraction = /^(-?\d+)\/(\d+)$/.exec(t);
  if (fraction) {
    const numer = Number(fraction[1]);
    const denom = Number(fraction[2]);
    if (denom === 0) return null;
    return numer / denom;
  }

  if (/^-?\d*\.?\d+$/.test(t) || /^-?\d+\.?$/.test(t)) {
    const v = Number.parseFloat(t);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

/**
 * Infer the notation a student is using from what they typed, so the controls
 * can follow them: a "/" means fractions, a "." means decimals. A bare integer
 * is ambiguous and leaves the current mode unchanged (null).
 */
export function detectFormat(text: string): NumberFormat | null {
  if (text.includes('/')) return 'fraction';
  if (text.includes('.')) return 'decimal';
  return null;
}

/** True while text is a valid in-progress entry (so we don't clobber mid-typing). */
export function isPartialNumberEntry(text: string): boolean {
  // Allow "", "-", "1.", ".", "1/", "-1/2", "0.5", "-3", etc.
  return /^-?\d*\.?\d*$/.test(text) || /^-?\d+\/\d*$/.test(text);
}
