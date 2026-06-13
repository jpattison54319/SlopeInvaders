import { useEffect, useRef } from 'react';
import { Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import type { Point } from '../logic/lineMath';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import type { Facing } from '../levels/types';
import { shipSprites, type ShipSpriteKey } from '../../assets/assetMap';
import { useImage } from './useImage';

/** Visual hull skin: which sprite to draw and an optional hue shift. */
export interface ShipSkinVisual {
  sprite: ShipSpriteKey;
  hue: number;
}

interface ShipProps {
  vp: Viewport;
  /** Graph position of the cannon (level.ship.position). */
  position: Point;
  /** Size of the ship in graph units. */
  size?: number;
  /** Which way the ship faces; mirrors the sprite horizontally when 'left'. */
  facing?: Facing;
  /** Equipped cosmetic hull (sprite + hue). Defaults to the green Scout. */
  skin?: ShipSkinVisual;
}

/** The player's cannon/ship sprite, anchored at its graph position. */
export function Ship({ vp, position, size = 1.4, facing = 'right', skin }: ShipProps) {
  const sprite = skin?.sprite ?? 'scout';
  const hue = skin?.hue ?? 0;
  const img = useImage(shipSprites[sprite]);
  const ref = useRef<Konva.Image>(null);

  // Hue-rotation tinting needs the node cached so Konva can run the filter.
  useEffect(() => {
    const node = ref.current;
    if (!node || !img) return;
    node.clearCache();
    if (hue !== 0) node.cache();
    node.getLayer()?.batchDraw();
  }, [img, hue, sprite, facing, position.x, position.y, size, vp.unit]);

  if (!img) return null;

  const px = graphToScreen(position, vp);
  const sidePx = size * vp.unit;

  return (
    <KonvaImage
      ref={ref}
      image={img}
      x={px.x}
      y={px.y}
      width={sidePx}
      height={sidePx}
      offsetX={sidePx / 2}
      offsetY={sidePx / 2}
      scaleX={facing === 'left' ? -1 : 1}
      filters={hue !== 0 ? [Konva.Filters.HSV] : undefined}
      hue={hue}
      imageSmoothingEnabled={false}
      listening={false}
    />
  );
}
