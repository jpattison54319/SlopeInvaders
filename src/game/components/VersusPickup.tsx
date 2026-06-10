import { Circle, Group, Text } from 'react-konva';
import type { VersusItem } from '../versus/types';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { COLORS } from './colors';
import { coordinateLabelLayout } from './asteroidLabelLayout';
import { versusPickupCoordinateLabel } from './versusPickupLabel';

type RenderedVersusItem = Pick<VersusItem, 'id' | 'point' | 'kind'>;

interface VersusPickupProps {
  vp: Viewport;
  item: RenderedVersusItem;
  showCoordinates?: boolean;
}

/** A temporary Versus attack pickup with its exact graph coordinate. */
export function VersusPickup({
  vp,
  item,
  showCoordinates = true,
}: VersusPickupProps) {
  const center = graphToScreen(item.point, vp);
  const radius = vp.unit * 0.42;
  const isAdd = item.kind === 'add';
  const color = isAdd ? COLORS.beam : '#8ff8ff';
  const coordinateLabel = versusPickupCoordinateLabel(item);
  const coordinateFontSize = 11;
  const coordinateBox = coordinateLabelLayout(
    coordinateLabel,
    radius * 2,
    coordinateFontSize,
  );

  return (
    <Group x={center.x} y={center.y} listening={false}>
      <Circle
        radius={radius}
        fill="rgba(7,11,32,0.7)"
        stroke={color}
        strokeWidth={2}
        shadowColor={color}
        shadowBlur={10}
      />
      <Text
        text={isAdd ? '+2' : '❄'}
        fontSize={radius}
        fontStyle="bold"
        fill={color}
        width={radius * 2}
        height={radius * 2}
        offsetX={radius}
        offsetY={radius}
        align="center"
        verticalAlign="middle"
      />
      {showCoordinates && (
        <Text
          x={coordinateBox.xOffset}
          y={radius + 3}
          width={coordinateBox.width}
          align="center"
          wrap={coordinateBox.wrap}
          text={coordinateLabel}
          fontSize={coordinateFontSize}
          fontFamily="monospace"
          fill={color}
        />
      )}
    </Group>
  );
}
