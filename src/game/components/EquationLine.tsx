import { Fragment } from 'react';
import { Line } from 'react-konva';
import type { Bounds, Viewport } from '../logic/coordinateTransform';
import { graphToScreen, lineBoardSegment } from '../logic/coordinateTransform';
import type { Facing, TrajectoryMode, TrajectoryStyle } from '../levels/types';
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
  /** Direction the ship fires. The bright segment runs this way. */
  facing?: Facing;
  /** Also draw the opposite-direction segment faded (the line is infinite both ways). */
  showReverse?: boolean;
}

function screenPoints(
  m: number,
  b: number,
  bounds: Bounds,
  fromX: number,
  facing: Facing,
  vp: Viewport,
): number[] | null {
  const seg = lineBoardSegment(m, b, bounds, fromX, facing);
  if (!seg) return null;
  const start = graphToScreen(seg.start, vp);
  const end = graphToScreen(seg.end, vp);
  return [start.x, start.y, end.x, end.y];
}

/**
 * The dashed amber "aiming" line for the current equation, clipped to the board.
 * `mode` controls visibility: 'always' (default), 'after-fire' (only while a shot
 * travels), or 'off'. 'dimmed' style de-emphasizes it.
 *
 * When `showReverse` is set (Zone 4), the line is drawn in two tones: bright in
 * the `facing` direction (where the shot actually goes) and faded in the opposite
 * direction — a visual reminder that y = mx + b is infinite both ways even though
 * the laser only fires forward.
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
  facing = 'right',
  showReverse = false,
}: EquationLineProps) {
  const visible = mode === 'off' ? false : mode === 'after-fire' ? !!faded : true;
  if (!visible) return null;

  const dimmed = style === 'dimmed';
  const baseOpacity = dimmed ? 0.4 : 0.8;
  // Fade the static preview while a shot animates (unless this IS the shot-time view).
  const opacity = faded && mode !== 'after-fire' ? 0.22 : baseOpacity;
  const dash = dimmed ? [4, 8] : [8, 6];

  const forward = screenPoints(m, b, bounds, fromX, facing, vp);
  const reverseFacing: Facing = facing === 'right' ? 'left' : 'right';
  const reverse =
    showReverse && !faded ? screenPoints(m, b, bounds, fromX, reverseFacing, vp) : null;

  if (!forward && !reverse) return null;

  return (
    <Fragment>
      {reverse && (
        <Line
          points={reverse}
          stroke={COLORS.preview}
          strokeWidth={2}
          dash={dash}
          opacity={0.18}
          listening={false}
        />
      )}
      {forward && (
        <Line
          points={forward}
          stroke={COLORS.preview}
          strokeWidth={2}
          dash={dash}
          opacity={opacity}
          listening={false}
        />
      )}
    </Fragment>
  );
}
