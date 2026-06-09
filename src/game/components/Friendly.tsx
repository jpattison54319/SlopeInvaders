import { Group, Circle, Rect, Text } from 'react-konva';
import type { FriendlySpec } from '../levels/types';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { COLORS } from './colors';

interface FriendlyProps {
  vp: Viewport;
  friendly: FriendlySpec;
  /** Size of the ship in graph units. */
  size?: number;
  /** Show the "(x, y)" coordinate label. Default true. */
  showCoordinates?: boolean;
}

// 5×5 pixel mask for a small, blocky ally ship (a rounded shuttle).
const SHIP_MASK = ['00100', '01110', '11111', '11111', '01010'];

/**
 * A friendly ship the shot must avoid (Zone 7). Rendered green with a shield
 * ring so it reads as an ally, visually distinct from the grey rock asteroids.
 * Hitting one scrubs the shot (see hitDetection.hitsFriendly + Game.tsx).
 */
export function Friendly({ vp, friendly, size = 1.0, showCoordinates = true }: FriendlyProps) {
  const center = graphToScreen(friendly.position, vp);
  const shipPx = size * vp.unit;
  const cell = shipPx / SHIP_MASK.length;
  const topLeft = { x: center.x - shipPx / 2, y: center.y - shipPx / 2 };

  const pixels = [];
  for (let row = 0; row < SHIP_MASK.length; row++) {
    for (let col = 0; col < SHIP_MASK[row].length; col++) {
      if (SHIP_MASK[row][col] !== '1') continue;
      pixels.push(
        <Rect
          key={`${row},${col}`}
          x={topLeft.x + col * cell}
          y={topLeft.y + row * cell}
          width={cell + 0.5}
          height={cell + 0.5}
          fill={row <= 1 ? COLORS.friendly : COLORS.friendlyDark}
        />,
      );
    }
  }

  return (
    <Group listening={false}>
      {/* Shield ring marks it as protected / do-not-hit. */}
      <Circle x={center.x} y={center.y} radius={shipPx * 0.62} stroke={COLORS.friendly} strokeWidth={1.5} opacity={0.7} />
      <Circle x={center.x} y={center.y} radius={shipPx * 0.62} fill={COLORS.friendlyShield} opacity={0.25} />
      {pixels}
      {showCoordinates && (
        <Text
          x={center.x - shipPx}
          y={center.y + shipPx / 2 + 2}
          width={shipPx * 2}
          align="center"
          text={`(${friendly.position.x}, ${friendly.position.y})`}
          fontSize={11}
          fontFamily="monospace"
          fill={COLORS.friendly}
        />
      )}
    </Group>
  );
}
