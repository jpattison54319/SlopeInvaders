import { describe, it, expect } from 'vitest';
import { buildFeedback, escalateMissFeedback, neededSlope } from './hints';
import { evaluateShot } from './hitDetection';
import type { AsteroidSpec, ControlKey } from '../levels/types';

const asteroids: AsteroidSpec[] = [
  { id: 'a1', weakPoint: { x: 4, y: 6 } },
  { id: 'a2', weakPoint: { x: 5, y: 7 } },
];

describe('buildFeedback', () => {
  it('explains a hit with the matching coordinates', () => {
    // y = x + 2 passes through (4, 6)
    const results = evaluateShot(1, 2, [asteroids[0]], 0);
    const fb = buildFeedback(1, 2, results);
    expect(fb.hit).toBe(true);
    expect(fb.detail).toContain('At x = 4');
    expect(fb.detail).toContain('y = 6');
  });

  it('explains a miss and suggests increasing slope/intercept when below', () => {
    // y = x at x=5 -> 5, target (5,7): line is below the asteroid
    const results = evaluateShot(1, 0, [{ id: 'a', weakPoint: { x: 5, y: 7 } }], 0);
    const fb = buildFeedback(1, 0, results);
    expect(fb.hit).toBe(false);
    expect(fb.detail).toContain('y = x');
    expect(fb.detail).toContain('(5, 7)');
    expect(fb.detail.toLowerCase()).toContain('increasing');
  });
});

describe('neededSlope', () => {
  it('solves the slope through a point for a fixed intercept', () => {
    expect(neededSlope(3, 6, 0)).toBe(2); // y = 2x hits (3,6)
    expect(neededSlope(2, 7, 1)).toBe(3); // y = 3x + 1 hits (2,7)
  });
  it('returns null on the y-axis (any slope passes through)', () => {
    expect(neededSlope(0, 5, 0)).toBeNull();
  });
});

describe('escalateMissFeedback', () => {
  const slopeControls: ControlKey[] = ['slope'];
  // y = x missing (5,7): line passes below the target.
  const missResults = evaluateShot(1, 0, [{ id: 'a', weakPoint: { x: 5, y: 7 } }], 0);
  const base = buildFeedback(1, 0, missResults);
  const params = {
    m: 1,
    b: 0,
    results: missResults,
    equationForm: 'y=mx' as const,
    allowedControls: slopeControls,
    previewLocked: false,
  };

  it('leaves the first miss unchanged', () => {
    const out = escalateMissFeedback(base, { ...params, consecutiveMisses: 1 });
    expect(out.feedback).toBe(base);
    expect(out.restorePreview).toBe(false);
  });

  it('names the lever and direction on the second miss without restoring preview', () => {
    const out = escalateMissFeedback(base, { ...params, consecutiveMisses: 2 });
    expect(out.feedback.headline).toBe('Training Assist');
    expect(out.feedback.detail.toLowerCase()).toContain('nudge the slope up');
    expect(out.restorePreview).toBe(false);
  });

  it('reveals the needed slope and restores the preview from the third miss', () => {
    const out = escalateMissFeedback(base, { ...params, consecutiveMisses: 3 });
    expect(out.feedback.detail).toContain('set the slope to about 1.4'); // 7/5
    expect(out.feedback.detail.toLowerCase()).toContain('slope scanner');
    expect(out.restorePreview).toBe(true);
  });

  it('never restores the preview when the no-preview lesson is locked', () => {
    const out = escalateMissFeedback(base, {
      ...params,
      consecutiveMisses: 3,
      previewLocked: true,
    });
    expect(out.restorePreview).toBe(false);
    expect(out.feedback.detail.toLowerCase()).not.toContain('slope scanner');
  });

  it('withholds the numeric slope when facing/x-offset make it ambiguous', () => {
    const out = escalateMissFeedback(base, {
      ...params,
      consecutiveMisses: 3,
      allowedControls: ['slope', 'direction'],
    });
    expect(out.feedback.detail).not.toContain('set the slope to about');
    expect(out.feedback.detail.toLowerCase()).toContain('dashed aiming line');
  });

  it('returns a hit unchanged', () => {
    const hitResults = evaluateShot(2, 0, [{ id: 'a', weakPoint: { x: 3, y: 6 } }], 0);
    const hitBase = buildFeedback(2, 0, hitResults);
    const out = escalateMissFeedback(hitBase, { ...params, consecutiveMisses: 5 });
    expect(out.feedback).toBe(hitBase);
    expect(out.restorePreview).toBe(false);
  });
});
