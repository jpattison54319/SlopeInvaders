import { useEffect, useRef } from 'react';
import { Group, Circle, Rect } from 'react-konva';
import Konva from 'konva';
import type { Point } from '../logic/lineMath';
import type { Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { COLORS } from './colors';

interface ExplosionProps {
  vp: Viewport;
  /** Graph-space location of the boom. */
  point: Point;
  /** Called once the animation finishes so the parent can drop it. */
  onDone: () => void;
}

const DURATION_MS = 450;

/** A short, self-animating 8-bit explosion burst that removes itself when done. */
export function Explosion({ vp, point, onDone }: ExplosionProps) {
  const groupRef = useRef<Konva.Group>(null);
  const done = useRef(false);

  useEffect(() => {
    const node = groupRef.current;
    const layer = node?.getLayer();
    if (!node || !layer) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const t = Math.min(1, frame.time / DURATION_MS);
      const scale = 0.4 + t * 1.3;
      node.scale({ x: scale, y: scale });
      node.opacity(1 - t);
      if (t >= 1 && !done.current) {
        done.current = true;
        anim.stop();
        onDone();
      }
    }, layer);
    anim.start();
    return () => {
      anim.stop();
    };
    // onDone is stable enough for a one-shot; deps intentionally empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const px = graphToScreen(point, vp);
  const r = vp.unit * 0.5;

  // A ring plus four radiating shards.
  const shards = [0, 90, 180, 270].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return (
      <Rect
        key={deg}
        x={Math.cos(rad) * r}
        y={Math.sin(rad) * r}
        width={r * 0.4}
        height={r * 0.4}
        offsetX={r * 0.2}
        offsetY={r * 0.2}
        rotation={deg}
        fill={COLORS.explosion}
      />
    );
  });

  return (
    <Group ref={groupRef} x={px.x} y={px.y} listening={false}>
      <Circle radius={r} stroke={COLORS.explosion} strokeWidth={3} />
      <Circle radius={r * 0.5} fill={COLORS.weakPoint} />
      {shards}
    </Group>
  );
}
