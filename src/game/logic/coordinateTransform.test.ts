import { describe, it, expect } from 'vitest';
import {
  createViewport,
  graphToScreen,
  screenToGraph,
  lineBoardSegment,
  type Bounds,
} from './coordinateTransform';

const bounds: Bounds = { minX: 0, maxX: 10, minY: 0, maxY: 10 };

describe('viewport transforms', () => {
  const vp = createViewport(600, 600, bounds, 50);

  it('maps the origin to the bottom-left of the plotted area', () => {
    const s = graphToScreen({ x: 0, y: 0 }, vp);
    expect(s.x).toBeCloseTo(50);
    expect(s.y).toBeCloseTo(550); // height - padding
  });

  it('flips the y-axis (graph up = screen up)', () => {
    const low = graphToScreen({ x: 0, y: 0 }, vp);
    const high = graphToScreen({ x: 0, y: 10 }, vp);
    expect(high.y).toBeLessThan(low.y);
  });

  it('round-trips graph -> screen -> graph', () => {
    const p = { x: 3, y: 7 };
    const back = screenToGraph(graphToScreen(p, vp), vp);
    expect(back.x).toBeCloseTo(3);
    expect(back.y).toBeCloseTo(7);
  });
});

describe('viewport transforms — Quadrant IV', () => {
  // Zone 3 bounds: ship at top-left origin, positive x right, negative y down.
  const q4: Bounds = { minX: 0, maxX: 10, minY: -10, maxY: 0 };
  const vp = createViewport(600, 600, q4, 50);

  it('maps the origin to the top-left of the plotted area', () => {
    const s = graphToScreen({ x: 0, y: 0 }, vp);
    expect(s.x).toBeCloseTo(50);
    expect(s.y).toBeCloseTo(50); // top, not bottom
  });

  it('places a negative-y target below and to the right of the origin', () => {
    const origin = graphToScreen({ x: 0, y: 0 }, vp);
    const target = graphToScreen({ x: 4, y: -6 }, vp);
    expect(target.x).toBeGreaterThan(origin.x); // positive x → right
    expect(target.y).toBeGreaterThan(origin.y); // negative y → down (larger screen y)
  });

  it('clips a falling line y = -2x into the board', () => {
    const seg = lineBoardSegment(-2, 0, q4, 0);
    expect(seg).not.toBeNull();
    expect(seg!.start).toEqual({ x: 0, y: 0 });
    expect(seg!.end.y).toBeCloseTo(-10); // reaches the bottom edge
    expect(seg!.end.x).toBeCloseTo(5);
  });
});

describe('lineBoardSegment', () => {
  it('clips y = x to the board', () => {
    const seg = lineBoardSegment(1, 0, bounds, 0);
    expect(seg).not.toBeNull();
    expect(seg!.start).toEqual({ x: 0, y: 0 });
    expect(seg!.end).toEqual({ x: 10, y: 10 });
  });

  it('stops at the top edge for a steep line', () => {
    // y = 2x reaches y=10 at x=5, so the segment ends there.
    const seg = lineBoardSegment(2, 0, bounds, 0);
    expect(seg!.end.x).toBeCloseTo(5);
    expect(seg!.end.y).toBeCloseTo(10);
  });

  it('honors the firing-direction start x', () => {
    const seg = lineBoardSegment(1, 0, bounds, 3);
    expect(seg!.start.x).toBe(3);
  });

  it('returns null when a horizontal line is off the board', () => {
    expect(lineBoardSegment(0, 99, bounds, 0)).toBeNull();
  });

  it('clips leftward when facing left', () => {
    const all: Bounds = { minX: -10, maxX: 10, minY: -10, maxY: 10 };
    const seg = lineBoardSegment(1, 0, all, 0, 'left'); // y = x, x ≤ 0
    expect(seg).not.toBeNull();
    expect(seg!.start).toEqual({ x: -10, y: -10 });
    expect(seg!.end).toEqual({ x: 0, y: 0 });
  });

  it('clips rightward when facing right', () => {
    const all: Bounds = { minX: -10, maxX: 10, minY: -10, maxY: 10 };
    const seg = lineBoardSegment(1, 0, all, 0, 'right'); // y = x, x ≥ 0
    expect(seg!.start).toEqual({ x: 0, y: 0 });
    expect(seg!.end).toEqual({ x: 10, y: 10 });
  });
});

describe('viewport transforms — all quadrants', () => {
  const all: Bounds = { minX: -10, maxX: 10, minY: -10, maxY: 10 };
  const vp = createViewport(600, 600, all, 50);

  it('maps the origin to the center of the plotted area', () => {
    const s = graphToScreen({ x: 0, y: 0 }, vp);
    expect(s.x).toBeCloseTo(300);
    expect(s.y).toBeCloseTo(300);
  });

  it('places (-4, 3) left of and above the center', () => {
    const origin = graphToScreen({ x: 0, y: 0 }, vp);
    const p = graphToScreen({ x: -4, y: 3 }, vp);
    expect(p.x).toBeLessThan(origin.x); // negative x → left
    expect(p.y).toBeLessThan(origin.y); // positive y → up (smaller screen y)
  });
});
