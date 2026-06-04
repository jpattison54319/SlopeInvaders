import { Line } from 'react-konva';
import type { Bounds, Viewport } from '../logic/coordinateTransform';
import { graphToScreen, lineBoardSegment } from '../logic/coordinateTransform';
import { COLORS } from './colors';

interface EquationLineProps {
  vp: Viewport;
  bounds: Bounds;
  m: number;
  b: number;
  /** x to start drawing from (the cannon's x). */
  fromX: number;
  /** Dim the preview while a shot is in flight. */
  faded?: boolean;
}

/**
 * The dashed amber "aiming" line for the current equation y = m·x + b, clipped
 * to the visible board. This is the preview the student adjusts before firing.
 */
export function EquationLine({ vp, bounds, m, b, fromX, faded }: EquationLineProps) {
  const seg = lineBoardSegment(m, b, bounds, fromX);
  if (!seg) return null;

  const start = graphToScreen(seg.start, vp);
  const end = graphToScreen(seg.end, vp);

  return (
    <Line
      points={[start.x, start.y, end.x, end.y]}
      stroke={COLORS.preview}
      strokeWidth={2}
      dash={[8, 6]}
      opacity={faded ? 0.25 : 0.8}
      listening={false}
    />
  );
}
