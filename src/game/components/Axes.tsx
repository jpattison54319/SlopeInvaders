import type { ReactNode } from 'react';
import { Line, Text } from 'react-konva';
import type { Bounds, Viewport } from '../logic/coordinateTransform';
import { graphToScreen } from '../logic/coordinateTransform';
import { COLORS } from './colors';

interface AxesProps {
  vp: Viewport;
  bounds: Bounds;
  step?: number;
  /** Show numeric tick labels + the origin "0". Default true. */
  showLabels?: boolean;
}

/** The x and y axes with optional numeric tick labels. */
export function Axes({ vp, bounds, step = 1, showLabels = true }: AxesProps) {
  const origin = graphToScreen({ x: 0, y: 0 }, vp);
  // Span each axis across the full bounds so they render in any quadrant
  // (e.g. Quadrant IV, where maxY = 0 and the y-axis must extend downward).
  const xStart = graphToScreen({ x: bounds.minX, y: 0 }, vp);
  const xEnd = graphToScreen({ x: bounds.maxX, y: 0 }, vp);
  const yStart = graphToScreen({ x: 0, y: bounds.minY }, vp);
  const yEnd = graphToScreen({ x: 0, y: bounds.maxY }, vp);

  const labels: ReactNode[] = [];
  for (let x = bounds.minX; showLabels && x <= bounds.maxX + 1e-9; x += step) {
    if (x === 0) continue;
    const p = graphToScreen({ x, y: 0 }, vp);
    labels.push(
      <Text
        key={`xl${x}`}
        x={p.x - 8}
        y={p.y + 6}
        text={String(x)}
        fontSize={11}
        fontFamily="monospace"
        fill={COLORS.axisLabel}
      />,
    );
  }
  for (let y = bounds.minY; showLabels && y <= bounds.maxY + 1e-9; y += step) {
    if (y === 0) continue;
    const p = graphToScreen({ x: 0, y }, vp);
    labels.push(
      <Text
        key={`yl${y}`}
        x={p.x - 18}
        y={p.y - 6}
        text={String(y)}
        fontSize={11}
        fontFamily="monospace"
        fill={COLORS.axisLabel}
      />,
    );
  }

  return (
    <>
      {/* x-axis */}
      <Line points={[xStart.x, xStart.y, xEnd.x, xEnd.y]} stroke={COLORS.axis} strokeWidth={2} />
      {/* y-axis */}
      <Line points={[yStart.x, yStart.y, yEnd.x, yEnd.y]} stroke={COLORS.axis} strokeWidth={2} />
      {/* axis names */}
      <Text x={xEnd.x - 4} y={xEnd.y + 8} text="x" fontSize={14} fontStyle="bold" fontFamily="monospace" fill={COLORS.axis} />
      <Text x={yEnd.x - 16} y={yEnd.y - 4} text="y" fontSize={14} fontStyle="bold" fontFamily="monospace" fill={COLORS.axis} />
      {/* origin label */}
      {showLabels && (
        <Text x={origin.x - 14} y={origin.y + 6} text="0" fontSize={11} fontFamily="monospace" fill={COLORS.axisLabel} />
      )}
      {labels}
    </>
  );
}
