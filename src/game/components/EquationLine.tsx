import { Line } from 'react-konva';
import type { Bounds, Viewport } from '../logic/coordinateTransform';
import { graphToScreen, lineBoardSegment } from '../logic/coordinateTransform';
import type { TrajectoryMode, TrajectoryStyle } from '../levels/types';
import { COLORS } from './colors';

interface EquationLineProps {
  vp: Viewport;
  bounds: Bounds;
  m: number;
  b: number;
  /** x to start drawing from (the cannon's x). */
  fromX: number;
  /** True while a shot is in flight. */
  faded?: boolean;
  /** When the preview is shown: always / only during a shot / never. */
  mode?: TrajectoryMode;
  /** 'dimmed' renders a subtler line (used when the player should rely less on it). */
  style?: TrajectoryStyle;
}

/**
 * The dashed amber "aiming" line for the current equation, clipped to the board.
 * `mode` controls visibility: 'always' (default), 'after-fire' (only while a shot
 * travels), or 'off'. 'dimmed' style de-emphasizes it.
 */
export function EquationLine({
  vp,
  bounds,
  m,
  b,
  fromX,
  faded,
  mode = 'always',
  style = 'normal',
}: EquationLineProps) {
  const visible = mode === 'off' ? false : mode === 'after-fire' ? !!faded : true;
  if (!visible) return null;

  const seg = lineBoardSegment(m, b, bounds, fromX);
  if (!seg) return null;

  const start = graphToScreen(seg.start, vp);
  const end = graphToScreen(seg.end, vp);

  const dimmed = style === 'dimmed';
  const baseOpacity = dimmed ? 0.4 : 0.8;
  // Fade the static preview while a shot animates (unless this IS the shot-time view).
  const opacity = faded && mode !== 'after-fire' ? 0.22 : baseOpacity;

  return (
    <Line
      points={[start.x, start.y, end.x, end.y]}
      stroke={COLORS.preview}
      strokeWidth={2}
      dash={dimmed ? [4, 8] : [8, 6]}
      opacity={opacity}
      listening={false}
    />
  );
}
