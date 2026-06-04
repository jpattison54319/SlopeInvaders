import { Image as KonvaImage } from 'react-konva';
import type { Point } from '../logic/lineMath';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { assets } from '../../assets/assetMap';
import { useImage } from './useImage';

interface ShipProps {
  vp: Viewport;
  /** Graph position of the cannon (level.ship.position). */
  position: Point;
  /** Size of the ship in graph units. */
  size?: number;
}

/** The player's cannon/ship sprite, anchored at its graph position. */
export function Ship({ vp, position, size = 1.4 }: ShipProps) {
  const img = useImage(assets.ship);
  if (!img) return null;

  const px = graphToScreen(position, vp);
  const sidePx = size * vp.unit;

  return (
    <KonvaImage
      image={img}
      x={px.x}
      y={px.y}
      width={sidePx}
      height={sidePx}
      offsetX={sidePx / 2}
      offsetY={sidePx / 2}
      imageSmoothingEnabled={false}
      listening={false}
    />
  );
}
