import { Line } from 'react-konva';
import type { Point } from '../logic/lineMath';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { COLORS } from './colors';

interface ChainProps {
  vp: Viewport;
  /** Weak points of the linked asteroids, in order. */
  points: Point[];
}

/**
 * The tether linking a group of chained asteroids (Zone 6). It draws a heavy
 * dashed segment through every member's weak point, signalling that one line
 * must pass through all of them. Members die together, so the parent simply
 * stops rendering the chain once the group is destroyed.
 */
export function Chain({ vp, points }: ChainProps) {
  if (points.length < 2) return null;
  const flat = points.flatMap((p) => {
    const s = graphToScreen(p, vp);
    return [s.x, s.y];
  });
  return (
    <Line
      points={flat}
      stroke={COLORS.chain}
      strokeWidth={3}
      opacity={0.8}
      dash={[3, 4]}
      lineCap="round"
      lineJoin="round"
      shadowColor={COLORS.chainGlow}
      shadowBlur={6}
      listening={false}
    />
  );
}
