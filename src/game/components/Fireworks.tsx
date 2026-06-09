import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Group, Rect, Circle } from 'react-konva';
import Konva from 'konva';

/** 8-bit celebratory firework bursts for the campaign finale. */
const BURST_COLORS = ['#ffd166', '#5ef1ff', '#ff4d6d', '#39d98a', '#c77dff', '#ffffff'];
const BURST_MS = 950;
const SHARD_COUNT = 12;
const SHARD_RADIUS = 26;

interface BurstSpec {
  id: string;
  x: number;
  y: number;
  color: string;
}

/** The radiating pixel shards of one burst, in local (centered) coordinates. */
function shards(color: string) {
  return Array.from({ length: SHARD_COUNT }, (_, i) => {
    const ang = (i / SHARD_COUNT) * Math.PI * 2;
    return (
      <Rect
        key={i}
        x={Math.cos(ang) * SHARD_RADIUS}
        y={Math.sin(ang) * SHARD_RADIUS}
        width={5}
        height={5}
        offsetX={2.5}
        offsetY={2.5}
        fill={color}
      />
    );
  });
}

/** A self-animating burst that expands, fades, and removes itself. */
function Burst({ spec, onDone }: { spec: BurstSpec; onDone: (id: string) => void }) {
  const ref = useRef<Konva.Group>(null);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    const layer = node?.getLayer();
    if (!node || !layer) return;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const t = Math.min(1, frame.time / BURST_MS);
      const scale = 0.3 + t * 1.5;
      node.scale({ x: scale, y: scale });
      node.opacity(1 - t * t);
      if (t >= 1 && !done.current) {
        done.current = true;
        anim.stop();
        onDone(spec.id);
      }
    }, layer);
    anim.start();
    return () => {
      anim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Group ref={ref} x={spec.x} y={spec.y} listening={false}>
      <Circle radius={4} fill="#ffffff" />
      {shards(spec.color)}
    </Group>
  );
}

interface FireworksProps {
  /** Render a handful of static bursts instead of animating (accessibility). */
  reducedMotion?: boolean;
}

/**
 * A full-viewport overlay of 8-bit firework bursts for the campaign-complete
 * screen. Pointer-events are disabled so it never blocks the buttons beneath it;
 * with reduced motion it shows a static spray instead of animating.
 */
export function Fireworks({ reducedMotion = false }: FireworksProps) {
  const [size, setSize] = useState(() => ({
    w: typeof window === 'undefined' ? 800 : window.innerWidth,
    h: typeof window === 'undefined' ? 600 : window.innerHeight,
  }));
  const [bursts, setBursts] = useState<BurstSpec[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reduced motion: a fixed celebratory spray, derived (no animation, no timers).
  const staticBursts = useMemo<BurstSpec[]>(
    () =>
      reducedMotion
        ? Array.from({ length: 6 }, (_, i) => ({
            id: `static-${i}`,
            x: (0.16 + 0.14 * i) * size.w,
            y: (0.24 + (i % 2) * 0.22) * size.h,
            color: BURST_COLORS[i % BURST_COLORS.length],
          }))
        : [],
    [reducedMotion, size.w, size.h],
  );

  // Full motion: spawn bursts on a timer (the interval callback is the only setState).
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      const id = `burst-${idRef.current++}`;
      const x = (0.1 + Math.random() * 0.8) * window.innerWidth;
      const y = (0.12 + Math.random() * 0.5) * window.innerHeight;
      const color = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
      setBursts((prev) => [...prev, { id, x, y, color }]);
    }, 430);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const remove = useCallback((id: string) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <div className="fireworks" aria-hidden="true">
      <Stage width={size.w} height={size.h} listening={false}>
        <Layer>
          {staticBursts.map((spec) => (
            <Group key={spec.id} x={spec.x} y={spec.y} scaleX={1.4} scaleY={1.4} listening={false}>
              <Circle radius={4} fill="#ffffff" />
              {shards(spec.color)}
            </Group>
          ))}
          {!reducedMotion &&
            bursts.map((spec) => <Burst key={spec.id} spec={spec} onDone={remove} />)}
        </Layer>
      </Stage>
    </div>
  );
}
