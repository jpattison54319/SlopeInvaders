import { Line } from 'react-konva';
import type { WallSpec } from '../levels/types';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { COLORS } from './colors';

interface WallProps {
  vp: Viewport;
  wall: WallSpec;
}

/**
 * Asteroid wall / shield placeholder.
 *
 * Level 1 has no walls, but this renders a level's wall segments so future
 * levels can drop them in. It draws a thick energy-barrier line in the 8-bit
 * palette.
 *
 * TODO: render shield "gaps" as breaks in the barrier, and pair this with
 *       hitDetection.isPathBlocked() so walls actually stop shots.
 */
export function Wall({ vp, wall }: WallProps) {
  const a = graphToScreen(wall.from, vp);
  const b = graphToScreen(wall.to, vp);
  return (
    <Line
      points={[a.x, a.y, b.x, b.y]}
      stroke={COLORS.wall}
      strokeWidth={6}
      opacity={0.5}
      dash={[2, 6]}
      lineCap="round"
      shadowColor={COLORS.wall}
      shadowBlur={10}
      listening={false}
    />
  );
}
