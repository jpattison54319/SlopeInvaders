/**
 * hints — build student-facing educational feedback after each shot.
 *
 * The messages explain *why* a shot hit or missed in terms of the equation,
 * and nudge the student toward the right adjustment on a miss.
 */
import type { AsteroidSpec, ControlKey, EquationForm } from '../levels/types';
import type { ShotResult } from './hitDetection';

export interface ShotFeedback {
  hit: boolean;
  headline: string;
  detail: string;
}

/** Format a number tidily: integers as-is, otherwise up to 2 decimals. */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function formatEquation(m: number, b: number): string {
  if (m === 0) return `y = ${fmt(b)}`;
  const mPart = m === 1 ? '' : m === -1 ? '-' : fmt(m);
  let s = `y = ${mPart}x`;
  if (b !== 0) {
    s += ` ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}`;
  }
  return s;
}

/**
 * Produce feedback for a shot given its per-asteroid results.
 * `asteroidsById` is currently unused but kept in the signature so feedback can
 * later reference asteroid names/types without a breaking change.
 */
export function buildFeedback(
  m: number,
  b: number,
  results: ShotResult[],
  _asteroidsById?: Map<string, AsteroidSpec>,
): ShotFeedback {
  void _asteroidsById;

  if (results.length === 0) {
    return { hit: false, headline: 'No targets', detail: 'There are no asteroids left to hit.' };
  }

  const hits = results.filter((r) => r.hit);
  if (hits.length > 0) {
    const detail = hits
      .map((h) => {
        const { x, y } = h.weakPoint;
        return `At x = ${fmt(x)}, your equation gives y = ${fmt(h.lineYAtX)}, matching the asteroid at (${fmt(x)}, ${fmt(y)}).`;
      })
      .join(' ');
    const headline =
      hits.length === 1 ? 'Hit!' : `Multi-hit! ${hits.length} asteroids destroyed!`;
    return { hit: true, headline, detail };
  }

  // Miss — coach toward the closest asteroid.
  const nearest = results.reduce((best, r) => (r.missDistance < best.missDistance ? r : best));
  const { x, y } = nearest.weakPoint;
  const passedBelow = nearest.lineYAtX < y;
  const nudge = passedBelow
    ? 'Your line passed below it — try increasing the slope or the y-intercept.'
    : 'Your line passed above it — try decreasing the slope or the y-intercept.';
  const eq = formatEquation(m, b);
  const delta = Math.abs(nearest.lineYAtX - y);
  return {
    hit: false,
    headline: 'Miss.',
    detail: `Your line ${eq} passed ${fmt(delta)} ${passedBelow ? 'below' : 'above'} the asteroid at (${fmt(x)}, ${fmt(y)}). ${nudge}`,
  };
}

/**
 * The slope that makes the line y = m·x + b pass through (x, y) for a fixed
 * intercept b. Returns null when x = 0 (any slope passes through the y-axis).
 */
export function neededSlope(x: number, y: number, b: number): number | null {
  if (x === 0) return null;
  return Math.round(((y - b) / x) * 100) / 100;
}

export interface EscalationParams {
  /** Dialed slope / intercept for this shot. */
  m: number;
  b: number;
  results: ShotResult[];
  /** Misses in a row on the current target (1 = the first miss). */
  consecutiveMisses: number;
  equationForm: EquationForm;
  allowedControls: ControlKey[];
  /** No-preview lesson is locked (mastery/Zone 9) — never auto-restore preview. */
  previewLocked: boolean;
}

export interface EscalatedFeedback {
  feedback: ShotFeedback;
  /** Turn the dashed aiming line on for the next shot (the strongest rung). */
  restorePreview: boolean;
}

/**
 * Grow miss feedback by how many times in a row the student has missed THIS
 * target — the "after 2 misses offer a hint; after more, restore the preview"
 * ladder from docs/agent/02. Framing stays positive and never references the
 * (teacher-only) difficulty tier. A hit is returned unchanged.
 *
 * The concrete slope value is only revealed when it is unambiguous to compute
 * from the dialed equation: a slope-driven line with no facing/x-offset mirror
 * (Zones 1–3). Otherwise the student is pointed at the dashed aiming line.
 */
export function escalateMissFeedback(base: ShotFeedback, p: EscalationParams): EscalatedFeedback {
  if (base.hit || p.results.length === 0) return { feedback: base, restorePreview: false };

  const nearest = p.results.reduce((best, r) => (r.missDistance < best.missDistance ? r : best));
  const { x, y } = nearest.weakPoint;
  const tooLow = nearest.lineYAtX < y;
  const lever = p.allowedControls.includes('slope') ? 'slope' : 'y-intercept';

  // Rung 1: the base feedback already gives direction + distance + a nudge.
  if (p.consecutiveMisses <= 1) return { feedback: base, restorePreview: false };

  // Rung 2: name the exact lever and which way to move it — an optional assist.
  if (p.consecutiveMisses === 2) {
    const move = `nudge the ${lever} ${tooLow ? 'up' : 'down'}`;
    return {
      feedback: {
        hit: false,
        headline: 'Training Assist',
        detail: `${base.detail} You need the line a little ${tooLow ? 'higher' : 'lower'} at x = ${fmt(x)} — ${move} and fire again.`,
      },
      restorePreview: false,
    };
  }

  // Rung 3+: reveal the concrete target value where it is safe to, and bring
  // the dashed aiming line back (unless the level locks it off).
  const canSolveSlope =
    lever === 'slope' &&
    (p.equationForm === 'y=mx' || p.equationForm === 'y=mx+b') &&
    !p.allowedControls.includes('direction') &&
    !p.allowedControls.includes('xOffset');
  const need = canSolveSlope ? neededSlope(x, y, p.b) : null;
  const valuePart =
    need !== null
      ? ` To pass through (${fmt(x)}, ${fmt(y)}) with this y-intercept, set the slope to about ${fmt(need)}.`
      : ` Watch the dashed aiming line and line it up with (${fmt(x)}, ${fmt(y)}).`;
  const restorePreview = !p.previewLocked;
  const scanner = restorePreview
    ? ' Slope Scanner online — your aiming line is back on for the next shot.'
    : '';
  return {
    feedback: {
      hit: false,
      headline: 'Training Assist',
      detail: `${base.detail}${valuePart}${scanner}`,
    },
    restorePreview,
  };
}
