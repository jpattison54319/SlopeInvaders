import { Group, Layer, Line, Rect, Stage } from 'react-konva';
import { assets } from '../../assets/assetMap';
import { Asteroid } from '../components/Asteroid';
import { Axes } from '../components/Axes';
import { EquationLine } from '../components/EquationLine';
import { Explosion } from '../components/Explosion';
import { Grid } from '../components/Grid';
import { Ship } from '../components/Ship';
import { useImage } from '../components/useImage';
import { COLORS } from '../components/colors';
import { createViewport, graphToScreen } from '../logic/coordinateTransform';
import { getYAtX } from '../logic/lineMath';
import { Image as KonvaImage } from 'react-konva';
import type {
  ArcadeAsteroid,
  ArcadeExplosion,
  ArcadeScorePopup,
  ArcadeShot,
} from './types';
import { ARCADE_BOUNDS } from './difficulty';
import type { Facing } from '../levels/types';
import { ScorePopup } from './ScorePopup';

interface ArcadeBoardProps {
  width: number;
  height: number;
  asteroids: ArcadeAsteroid[];
  holdMs: number;
  m: number;
  b: number;
  facing: Facing;
  shot: ArcadeShot | null;
  explosions: ArcadeExplosion[];
  scorePopups: ArcadeScorePopup[];
  reducedMotion: boolean;
  onExplosionDone: (id: string) => void;
  onScorePopupDone: (id: string) => void;
}

function formatCoordinate(value: number, moving: boolean): string {
  return moving ? value.toFixed(1) : String(Math.round(value));
}

export function ArcadeBoard({
  width,
  height,
  asteroids,
  holdMs,
  m,
  b,
  facing,
  shot,
  explosions,
  scorePopups,
  reducedMotion,
  onExplosionDone,
  onScorePopupDone,
}: ArcadeBoardProps) {
  const viewport = createViewport(width, height, ARCADE_BOUNDS);
  const starfield = useImage(assets.starfield);
  const bolt = useImage(assets.bolt);
  const launchPoint = { x: 0, y: getYAtX(m, b, 0) };
  const boltSize = viewport.unit * 0.7;

  const beam = shot
    ? (() => {
        const start = graphToScreen(shot.start, viewport);
        const currentGraph = {
          x: shot.start.x + (shot.end.x - shot.start.x) * shot.progress,
          y: shot.start.y + (shot.end.y - shot.start.y) * shot.progress,
        };
        const current = graphToScreen(currentGraph, viewport);
        const end = graphToScreen(shot.end, viewport);
        return {
          points: [start.x, start.y, current.x, current.y],
          bolt: current,
          angle: (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI,
        };
      })()
    : null;

  return (
    <Stage width={width} height={height}>
      <Layer>
        <Rect width={width} height={height} fill={COLORS.space} />
        {starfield && (
          <KonvaImage
            image={starfield}
            width={width}
            height={height}
            opacity={0.68}
            listening={false}
          />
        )}
        <Rect
          width={width}
          height={height}
          fill="rgba(7,11,32,0.42)"
          listening={false}
        />
        <Grid vp={viewport} bounds={ARCADE_BOUNDS} />
        <Axes vp={viewport} bounds={ARCADE_BOUNDS} showLabels />
        <EquationLine
          vp={viewport}
          bounds={ARCADE_BOUNDS}
          m={m}
          b={b}
          fromX={0}
          faded={!!shot}
          facing={facing}
          showReverse
        />

        {asteroids.map((asteroid) => {
          const center = graphToScreen({ x: asteroid.x, y: asteroid.y }, viewport);
          const holdRatio =
            asteroid.phase === 'holding'
              ? Math.max(0, 1 - asteroid.phaseElapsedMs / Math.max(1, holdMs))
              : 0;
          return (
            <Group key={asteroid.id}>
              {!reducedMotion && asteroid.phase === 'falling' && (
                <Line
                  points={[center.x, center.y - viewport.unit * 1.4, center.x, center.y - viewport.unit * 0.65]}
                  stroke={COLORS.weakPointGlow}
                  strokeWidth={2}
                  dash={[3, 4]}
                  opacity={0.52}
                  listening={false}
                />
              )}
              {asteroid.phase === 'holding' && (
                <Group listening={false}>
                  <Rect
                    x={center.x - viewport.unit * 0.46}
                    y={center.y - viewport.unit * 0.76}
                    width={viewport.unit * 0.92}
                    height={4}
                    fill="rgba(4, 9, 24, 0.9)"
                    stroke="rgba(143, 248, 255, 0.48)"
                    strokeWidth={1}
                  />
                  <Rect
                    x={center.x - viewport.unit * 0.46 + 1}
                    y={center.y - viewport.unit * 0.76 + 1}
                    width={Math.max(0, (viewport.unit * 0.92 - 2) * holdRatio)}
                    height={2}
                    fill={holdRatio > 0.35 ? COLORS.weakPointGlow : COLORS.explosion}
                  />
                </Group>
              )}
              <Asteroid
                vp={viewport}
                asteroid={{ id: asteroid.id, weakPoint: { x: asteroid.x, y: asteroid.y } }}
                coordinateLabel={`(${formatCoordinate(asteroid.x, false)}, ${formatCoordinate(
                  asteroid.y,
                  asteroid.phase === 'falling',
                )})`}
                animate={!reducedMotion}
              />
            </Group>
          );
        })}

        {beam && (
          <>
            <Line
              points={beam.points}
              stroke={COLORS.beam}
              strokeWidth={4}
              lineCap="round"
              shadowColor={COLORS.beam}
              shadowBlur={reducedMotion ? 0 : 12}
              listening={false}
            />
            <Line
              points={beam.points}
              stroke={COLORS.beamCore}
              strokeWidth={1.5}
              listening={false}
            />
          </>
        )}

        {explosions.map((explosion) => (
          <Explosion
            key={explosion.id}
            vp={viewport}
            point={explosion.point}
            onDone={() => onExplosionDone(explosion.id)}
          />
        ))}

        {scorePopups.map((popup) => (
          <ScorePopup
            key={popup.id}
            vp={viewport}
            point={popup.point}
            points={popup.points}
            reducedMotion={reducedMotion}
            onDone={() => onScorePopupDone(popup.id)}
          />
        ))}

        <Ship vp={viewport} position={launchPoint} facing={facing} />

        {beam && bolt && (
          <KonvaImage
            image={bolt}
            x={beam.bolt.x}
            y={beam.bolt.y}
            width={boltSize}
            height={boltSize}
            offsetX={boltSize / 2}
            offsetY={boltSize / 2}
            rotation={beam.angle}
            imageSmoothingEnabled={false}
            listening={false}
          />
        )}
      </Layer>
    </Stage>
  );
}
