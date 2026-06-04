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
});
