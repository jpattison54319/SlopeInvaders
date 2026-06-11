import { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Group, Text } from 'react-konva';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import type { Point } from '../logic/lineMath';

interface ScorePopupProps {
  vp: Viewport;
  point: Point;
  points: number;
  reducedMotion: boolean;
  onDone: () => void;
}

const DURATION_MS = 950;

/** Pixel-styled score feedback anchored to the destroyed asteroid. */
export function ScorePopup({
  vp,
  point,
  points,
  reducedMotion,
  onDone,
}: ScorePopupProps) {
  const groupRef = useRef<Konva.Group>(null);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const node = groupRef.current;
    const layer = node?.getLayer();
    if (!node || !layer) return;

    const startY = node.y();
    const floatDistance = reducedMotion ? 0 : Math.max(22, vp.unit * 0.82);
    const animation = new Konva.Animation((frame) => {
      if (!frame) return;
      const progress = Math.min(1, frame.time / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);

      node.y(startY - floatDistance * eased);
      node.opacity(progress < 0.62 ? 1 : Math.max(0, (1 - progress) / 0.38));

      if (!reducedMotion) {
        const popScale = progress < 0.16 ? 0.82 + (progress / 0.16) * 0.28 : 1;
        node.scale({ x: popScale, y: popScale });
      }

      if (progress >= 1 && !done.current) {
        done.current = true;
        animation.stop();
        onDoneRef.current();
      }
    }, layer);

    animation.start();
    return () => {
      animation.stop();
    };
  }, [reducedMotion, vp.unit]);

  const pixel = graphToScreen(point, vp);
  const width = Math.max(82, vp.unit * 2.8);
  const fontSize = Math.max(12, Math.min(18, vp.unit * 0.5));
  const left = Math.max(2, Math.min(vp.width - width - 2, pixel.x - width / 2));
  const y = Math.max(fontSize + 4, pixel.y - Math.max(30, vp.unit * 0.88));
  const label = `+${points}`;

  return (
    <Group
      ref={groupRef}
      x={left + width / 2}
      y={y}
      offsetX={width / 2}
      listening={false}
    >
      <Text
        text={label}
        width={width}
        y={3}
        align="center"
        fontFamily='"Press Start 2P", "Courier New", monospace'
        fontSize={fontSize}
        fontStyle="bold"
        fill="#070b20"
      />
      <Text
        text={label}
        width={width}
        align="center"
        fontFamily='"Press Start 2P", "Courier New", monospace'
        fontSize={fontSize}
        fontStyle="bold"
        fill="#ffd166"
        stroke="#6b3f00"
        strokeWidth={2}
        shadowColor="#070b20"
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={1}
        shadowBlur={0}
      />
    </Group>
  );
}
