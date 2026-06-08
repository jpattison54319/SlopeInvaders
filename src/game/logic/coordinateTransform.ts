/**
 * coordinateTransform — convert between math/graph space (y up) and screen/canvas
 * space (y down), and clip an equation line to the visible board.
 *
 * Keeping this separate from the React/Konva components means the rendering
 * layer never does ad-hoc math, and the transforms can be unit-tested.
 */
import type { Point } from './lineMath';
import { getYAtX } from './lineMath';
import type { Facing } from '../levels/types';

/** The math bounds of the visible board (in graph units). */
export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Mapping between graph units and on-screen pixels.
 * `origin` is the pixel location of graph point (0, 0); `unit` is pixels per
 * graph unit. y is flipped because canvas y grows downward.
 */
export interface Viewport {
  width: number;
  height: number;
  unit: number;
  origin: { x: number; y: number };
}

/**
 * Build a viewport that fits `bounds` into a `width`×`height` canvas with a
 * pixel `padding` around the plotted area.
 */
export function createViewport(
  width: number,
  height: number,
  bounds: Bounds,
  padding = 36,
): Viewport {
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  // Use a single unit for both axes so the grid stays square.
  const unit = Math.min(usableW / spanX, usableH / spanY);
  return {
    width,
    height,
    unit,
    // Place the math origin at the bottom-left of the plotted area.
    origin: {
      x: padding - bounds.minX * unit,
      y: height - padding + bounds.minY * unit,
    },
  };
}

/** Graph point → screen pixel. */
export function graphToScreen(point: Point, vp: Viewport): Point {
  return {
    x: vp.origin.x + point.x * vp.unit,
    y: vp.origin.y - point.y * vp.unit,
  };
}

/** Screen pixel → graph point (inverse of graphToScreen). */
export function screenToGraph(point: Point, vp: Viewport): Point {
  return {
    x: (point.x - vp.origin.x) / vp.unit,
    y: (vp.origin.y - point.y) / vp.unit,
  };
}

/**
 * Clip the line y = m·x + b to the board and to the firing direction. With
 * `facing = 'right'` the segment runs from `fromX` to the right edge (x ≥ fromX);
 * with `facing = 'left'` it runs from the left edge to `fromX` (x ≤ fromX).
 * Returns the graph-space start/end of the visible segment, or null if the line
 * never crosses the board within range.
 *
 * Used both to draw the preview line (forward bright, reverse faded) and to
 * animate the fired shot.
 */
export function lineBoardSegment(
  m: number,
  b: number,
  bounds: Bounds,
  fromX: number = bounds.minX,
  facing: Facing = 'right',
): { start: Point; end: Point } | null {
  let xStart = facing === 'right' ? Math.max(bounds.minX, fromX) : bounds.minX;
  let xEnd = facing === 'right' ? bounds.maxX : Math.min(bounds.maxX, fromX);
  if (xStart > xEnd) return null;

  if (m === 0) {
    // Horizontal line: visible only if its constant y is on the board.
    if (b < bounds.minY || b > bounds.maxY) return null;
  } else {
    // x values where the line crosses the top/bottom edges.
    const xAtMinY = (bounds.minY - b) / m;
    const xAtMaxY = (bounds.maxY - b) / m;
    xStart = Math.max(xStart, Math.min(xAtMinY, xAtMaxY));
    xEnd = Math.min(xEnd, Math.max(xAtMinY, xAtMaxY));
  }

  if (xStart > xEnd) return null;
  return {
    start: { x: xStart, y: getYAtX(m, b, xStart) },
    end: { x: xEnd, y: getYAtX(m, b, xEnd) },
  };
}
