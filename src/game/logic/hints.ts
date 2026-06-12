/**
 * hints — build student-facing educational feedback after each shot.
 *
 * The messages explain *why* a shot hit or missed in terms of the equation,
 * and nudge the student toward the right adjustment on a miss.
 */
import type { AsteroidSpec } from '../levels/types';
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
