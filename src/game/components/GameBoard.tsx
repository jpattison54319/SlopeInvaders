import { Stage, Layer, Rect, Line, Image as KonvaImage } from 'react-konva';
import type { Facing, LevelConfig, TrajectoryMode, TrajectoryStyle } from '../levels/types';
import type { Point } from '../logic/lineMath';
import type { VersusItem } from '../versus/types';
import { getYAtX } from '../logic/lineMath';
import { createViewport, graphToScreen } from '../logic/coordinateTransform';
import { assets } from '../../assets/assetMap';
import { COLORS } from './colors';
import { useImage } from './useImage';
import { Grid } from './Grid';
import { Axes } from './Axes';
import { EquationLine } from './EquationLine';
import { Asteroid } from './Asteroid';
import { Ship } from './Ship';
import { Wall } from './Wall';
import { Chain } from './Chain';
import { Friendly } from './Friendly';
import { Explosion } from './Explosion';
import { VersusPickup } from './VersusPickup';

/** A live explosion the board should render. */
export interface ExplosionInstance {
  id: string;
  point: Point;
}

/** The in-flight shot: a clipped line segment plus 0..1 travel progress. */
export interface ShotState {
  start: Point;
  end: Point;
  progress: number;
}

interface GameBoardProps {
  width: number;
  height: number;
  level: LevelConfig;
  m: number;
  b: number;
  /** Effective cannon x (base position + x-offset). */
  shipX: number;
  destroyed: ReadonlySet<string>;
  shot: ShotState | null;
  explosions: ExplosionInstance[];
  onExplosionDone: (id: string) => void;
  /** Trajectory-preview visibility + style (campaign per-level toggles). */
  trajectoryPreview?: TrajectoryMode;
  trajectoryStyle?: TrajectoryStyle;
  /** Show coordinate labels (axis ticks + asteroid coords). Default true. */
  showCoordinates?: boolean;
  /** In sequential-target levels, the only currently-hittable asteroid id. */
  activeTargetId?: string | null;
  /** Direction the ship faces / fires (Zone 4). */
  facing?: Facing;
  /** Draw the line both ways (bright forward, faded back) — Zone 4 preview. */
  bidirectional?: boolean;
  /** Optional Versus attack pickups to render on the grid. */
  items?: ReadonlyArray<Pick<VersusItem, 'id' | 'point' | 'kind'>>;
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Weak points of each still-alive linked group, for drawing the chain tether. */
function chainGroups(
  asteroids: LevelConfig['asteroids'],
  destroyed: ReadonlySet<string>,
): Array<[string, Point[]]> {
  const groups = new Map<string, Point[]>();
  for (const a of asteroids) {
    if (!a.linkGroup || destroyed.has(a.id)) continue;
    const pts = groups.get(a.linkGroup);
    if (pts) pts.push(a.weakPoint);
    else groups.set(a.linkGroup, [a.weakPoint]);
  }
  return [...groups].filter(([, pts]) => pts.length >= 2);
}

/** The coordinate-plane play area, rendered with React Konva. */
export function GameBoard({
  width,
  height,
  level,
  m,
  b,
  shipX,
  destroyed,
  shot,
  explosions,
  onExplosionDone,
  trajectoryPreview = 'always',
  trajectoryStyle = 'normal',
  showCoordinates = true,
  activeTargetId = null,
  facing = 'right',
  bidirectional = false,
  items = [],
}: GameBoardProps) {
  const vp = createViewport(width, height, level.bounds);
  const starfield = useImage(assets.starfield);
  const bolt = useImage(assets.bolt);
  // The ship IS the launch point: it sits on the line at its own x, so changing
  // b carries the ship up/down the y-axis with the line, and changing m pivots
  // the line around the ship. The Zone 8 x-offset control moves shipX.
  const launchPoint: Point = { x: shipX, y: getYAtX(m, b, shipX) };

  // Firing beam + projectile geometry (screen space).
  let beam: { points: number[]; bolt: Point; angle: number } | null = null;
  if (shot) {
    const startPx = graphToScreen(shot.start, vp);
    const current = lerp(shot.start, shot.end, shot.progress);
    const currentPx = graphToScreen(current, vp);
    const endPx = graphToScreen(shot.end, vp);
    beam = {
      points: [startPx.x, startPx.y, currentPx.x, currentPx.y],
      bolt: currentPx,
      angle: (Math.atan2(endPx.y - startPx.y, endPx.x - startPx.x) * 180) / Math.PI,
    };
  }

  const boltPx = vp.unit * 0.7;

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill={COLORS.space} />
        {starfield && (
          <KonvaImage image={starfield} x={0} y={0} width={width} height={height} opacity={0.7} listening={false} />
        )}
        {/* Darken slightly so the grid and sprites pop. */}
        <Rect x={0} y={0} width={width} height={height} fill="rgba(7,11,32,0.45)" listening={false} />

        <Grid vp={vp} bounds={level.bounds} />
        <Axes vp={vp} bounds={level.bounds} showLabels={showCoordinates} />

        {level.walls.map((w) => (
          <Wall key={w.id} vp={vp} wall={w} />
        ))}

        {/* Chains linking still-alive asteroid groups (Zone 6). */}
        {chainGroups(level.asteroids, destroyed).map(([groupId, pts]) => (
          <Chain key={groupId} vp={vp} points={pts} />
        ))}

        {/* Friendly ships the shot must avoid (Zone 7). */}
        {(level.friendlies ?? []).map((f) => (
          <Friendly key={f.id} vp={vp} friendly={f} showCoordinates={showCoordinates} />
        ))}

        <EquationLine
          vp={vp}
          bounds={level.bounds}
          m={m}
          b={b}
          fromX={shipX}
          faded={!!shot}
          mode={trajectoryPreview}
          style={trajectoryStyle}
          facing={facing}
          showReverse={bidirectional}
        />

        {level.asteroids
          .filter((a) => !destroyed.has(a.id))
          .map((a) => (
            <Asteroid
              key={a.id}
              vp={vp}
              asteroid={a}
              showCoordinates={showCoordinates}
              active={activeTargetId == null || a.id === activeTargetId}
            />
          ))}

        {/* Versus attack pickups */}
        {items.map((item) => (
          <VersusPickup
            key={item.id}
            vp={vp}
            item={item}
            showCoordinates={showCoordinates}
          />
        ))}

        {/* Firing beam */}
        {beam && (
          <>
            <Line
              points={beam.points}
              stroke={COLORS.beam}
              strokeWidth={4}
              opacity={0.9}
              lineCap="round"
              shadowColor={COLORS.beam}
              shadowBlur={12}
              listening={false}
            />
            <Line points={beam.points} stroke={COLORS.beamCore} strokeWidth={1.5} listening={false} />
          </>
        )}

        {explosions.map((e) => (
          <Explosion key={e.id} vp={vp} point={e.point} onDone={() => onExplosionDone(e.id)} />
        ))}

        <Ship vp={vp} position={launchPoint} facing={facing} />

        {/* Projectile head */}
        {beam && bolt && (
          <KonvaImage
            image={bolt}
            x={beam.bolt.x}
            y={beam.bolt.y}
            width={boltPx}
            height={boltPx}
            offsetX={boltPx / 2}
            offsetY={boltPx / 2}
            rotation={beam.angle}
            imageSmoothingEnabled={false}
            listening={false}
          />
        )}
      </Layer>
    </Stage>
  );
}
