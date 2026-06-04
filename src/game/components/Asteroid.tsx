import { useEffect, useRef, type ReactNode } from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import Konva from 'konva';
import type { AsteroidSpec } from '../levels/types';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { COLORS } from './colors';

interface AsteroidProps {
  vp: Viewport;
  asteroid: AsteroidSpec;
  /** Size of the rock in graph units. */
  size?: number;
}

// 7×7 pixel mask for a chunky, roundish 8-bit rock.
const ROCK_MASK = [
  '0011100',
  '0111110',
  '1111111',
  '1111111',
  '1111111',
  '0111110',
  '0011100',
];
// A few darker "crater" cells for texture.
const CRATERS = new Set(['1,4', '3,2', '4,5', '2,1']);

/**
 * A pixel-art asteroid centered on its weak point. The pulsing core marks the
 * exact coordinate the equation line must pass through; a small label shows the
 * target coordinates so students can connect the picture to the numbers.
 */
export function Asteroid({ vp, asteroid, size = 1.0 }: AsteroidProps) {
  const coreRef = useRef<Konva.Group>(null);

  // Self-contained pulse for the weak-point core (no React re-render).
  useEffect(() => {
    const node = coreRef.current;
    const layer = node?.getLayer();
    if (!node || !layer) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const phase = (frame.time / 1000) * 4;
      const s = 1 + 0.18 * Math.sin(phase);
      node.scale({ x: s, y: s });
      node.opacity(0.7 + 0.3 * (0.5 + 0.5 * Math.sin(phase)));
    }, layer);
    anim.start();
    return () => {
      anim.stop();
    };
  }, []);

  const center = graphToScreen(asteroid.weakPoint, vp);
  const rockPx = size * vp.unit;
  const cell = rockPx / ROCK_MASK.length;
  const topLeft = { x: center.x - rockPx / 2, y: center.y - rockPx / 2 };

  const pixels: ReactNode[] = [];
  for (let row = 0; row < ROCK_MASK.length; row++) {
    for (let col = 0; col < ROCK_MASK[row].length; col++) {
      if (ROCK_MASK[row][col] !== '1') continue;
      const key = `${row},${col}`;
      // Slight shading: top rows lighter, craters darker.
      let fill: string = COLORS.rock;
      if (CRATERS.has(key)) fill = COLORS.crater;
      else if (row <= 1) fill = COLORS.rockLight;
      else if (row >= 5) fill = COLORS.rockDark;
      pixels.push(
        <Rect
          key={key}
          x={topLeft.x + col * cell}
          y={topLeft.y + row * cell}
          width={cell + 0.5}
          height={cell + 0.5}
          fill={fill}
        />,
      );
    }
  }

  const coreR = rockPx * 0.16;

  return (
    <Group listening={false}>
      {pixels}
      {/* Pulsing weak-point core at the exact target coordinate. */}
      <Group ref={coreRef} x={center.x} y={center.y}>
        <Circle radius={coreR * 1.9} fill={COLORS.weakPointGlow} opacity={0.35} />
        <Circle radius={coreR} fill={COLORS.weakPoint} />
        <Circle radius={coreR * 0.4} fill="#ffffff" />
      </Group>
      {/* Target coordinate label. */}
      <Text
        x={center.x - rockPx / 2}
        y={center.y + rockPx / 2 + 2}
        width={rockPx}
        align="center"
        text={`(${asteroid.weakPoint.x}, ${asteroid.weakPoint.y})`}
        fontSize={11}
        fontFamily="monospace"
        fill={COLORS.weakPointGlow}
      />
    </Group>
  );
}
