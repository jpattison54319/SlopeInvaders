import type { ReactNode } from 'react';
import { Line } from 'react-konva';
import type { Bounds, Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { COLORS } from './colors';

interface GridProps {
  vp: Viewport;
  bounds: Bounds;
  /** Spacing between grid lines, in graph units. */
  step?: number;
}

/** Faint coordinate grid behind the play area. */
export function Grid({ vp, bounds, step = 1 }: GridProps) {
  const lines: ReactNode[] = [];

  for (let x = bounds.minX; x <= bounds.maxX + 1e-9; x += step) {
    const a = graphToScreen({ x, y: bounds.minY }, vp);
    const b = graphToScreen({ x, y: bounds.maxY }, vp);
    lines.push(
      <Line
        key={`v${x}`}
        points={[a.x, a.y, b.x, b.y]}
        stroke={x === 0 ? COLORS.gridMajor : COLORS.gridMinor}
        strokeWidth={1}
      />,
    );
  }

  for (let y = bounds.minY; y <= bounds.maxY + 1e-9; y += step) {
    const a = graphToScreen({ x: bounds.minX, y }, vp);
    const b = graphToScreen({ x: bounds.maxX, y }, vp);
    lines.push(
      <Line
        key={`h${y}`}
        points={[a.x, a.y, b.x, b.y]}
        stroke={y === 0 ? COLORS.gridMajor : COLORS.gridMinor}
        strokeWidth={1}
      />,
    );
  }

  return <>{lines}</>;
}
