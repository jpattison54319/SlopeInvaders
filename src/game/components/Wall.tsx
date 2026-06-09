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
 * Renders a level's wall/shield segments. These barriers block shots that cross
 * them, so they are part of both the puzzle logic and the visual language.
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
