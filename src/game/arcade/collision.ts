import {
  ARCADE_BOUNDS,
  ARCADE_FALL_MS,
  ARCADE_HIT_RADIUS,
  ARCADE_VERTICES,
} from './difficulty';
import type {
  ArcadeAsteroid,
  ArcadeShotEvaluation,
  MotionSegment,
} from './types';
import type { Point } from '../logic/lineMath';

function pointAt(start: Point, end: Point, t: number): Point {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

export function projectAsteroidMotion(
  asteroid: ArcadeAsteroid,
  durationMs: number,
  holdMs: number,
): MotionSegment[] {
  const segments: MotionSegment[] = [];
  let current = { ...asteroid };
  let cursor = 0;

  while (cursor < durationMs) {
    const phaseLeft = Math.max(0, current.phaseDurationMs - current.phaseElapsedMs);
    const segmentDuration = Math.min(durationMs - cursor, phaseLeft);
    const startProgress =
      current.phase === 'falling' && current.phaseDurationMs > 0
        ? current.phaseElapsedMs / current.phaseDurationMs
        : 0;
    const endProgress =
      current.phase === 'falling' && current.phaseDurationMs > 0
        ? (current.phaseElapsedMs + segmentDuration) / current.phaseDurationMs
        : 0;
    const startY =
      current.phase === 'falling'
        ? current.fromY + (current.toY - current.fromY) * startProgress
        : current.y;
    const endY =
      current.phase === 'falling'
        ? current.fromY + (current.toY - current.fromY) * endProgress
        : current.y;

    if (segmentDuration > 0) {
      segments.push({
        startMs: cursor,
        endMs: cursor + segmentDuration,
        start: { x: current.x, y: startY },
        end: { x: current.x, y: endY },
        moving: current.phase === 'falling',
      });
      cursor += segmentDuration;
      current.phaseElapsedMs += segmentDuration;
      current.y = endY;
    }

    if (current.phaseElapsedMs < current.phaseDurationMs) break;

    if (current.phase === 'holding') {
      const nextVertex = current.vertexIndex + 1;
      current = {
        ...current,
        phase: 'falling',
        fromY: current.y,
        toY:
          nextVertex < ARCADE_VERTICES.length
            ? ARCADE_VERTICES[nextVertex]
            : ARCADE_BOUNDS.minY,
        phaseElapsedMs: 0,
        phaseDurationMs: ARCADE_FALL_MS,
      };
    } else if (current.vertexIndex + 1 < ARCADE_VERTICES.length) {
      const vertexIndex = current.vertexIndex + 1;
      current = {
        ...current,
        phase: 'holding',
        vertexIndex,
        y: ARCADE_VERTICES[vertexIndex],
        fromY: ARCADE_VERTICES[vertexIndex],
        toY: ARCADE_VERTICES[vertexIndex],
        phaseElapsedMs: 0,
        phaseDurationMs: holdMs,
      };
    } else {
      break;
    }
  }

  return segments;
}

interface ClosestApproach {
  timeMs: number;
  distance: number;
  projectilePoint: Point;
  asteroidPoint: Point;
}

function closestApproach(
  projectileStart: Point,
  projectileEnd: Point,
  shotDurationMs: number,
  segment: MotionSegment,
): ClosestApproach {
  const startMs = segment.startMs;
  const endMs = segment.endMs;
  const segmentDuration = Math.max(1e-9, endMs - startMs);
  const projectileVelocity = {
    x: (projectileEnd.x - projectileStart.x) / shotDurationMs,
    y: (projectileEnd.y - projectileStart.y) / shotDurationMs,
  };
  const asteroidVelocity = {
    x: (segment.end.x - segment.start.x) / segmentDuration,
    y: (segment.end.y - segment.start.y) / segmentDuration,
  };
  const relativeAtStart = {
    x:
      projectileStart.x +
      projectileVelocity.x * startMs -
      segment.start.x,
    y:
      projectileStart.y +
      projectileVelocity.y * startMs -
      segment.start.y,
  };
  const relativeVelocity = {
    x: projectileVelocity.x - asteroidVelocity.x,
    y: projectileVelocity.y - asteroidVelocity.y,
  };
  const denom =
    relativeVelocity.x * relativeVelocity.x + relativeVelocity.y * relativeVelocity.y;
  const localDuration = endMs - startMs;
  const localTime =
    denom === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            localDuration,
            -(
              relativeAtStart.x * relativeVelocity.x +
              relativeAtStart.y * relativeVelocity.y
            ) / denom,
          ),
        );
  const timeMs = startMs + localTime;
  const projectilePoint = pointAt(projectileStart, projectileEnd, timeMs / shotDurationMs);
  const asteroidPoint = pointAt(segment.start, segment.end, localTime / segmentDuration);
  const distance = Math.hypot(
    projectilePoint.x - asteroidPoint.x,
    projectilePoint.y - asteroidPoint.y,
  );
  return { timeMs, distance, projectilePoint, asteroidPoint };
}

export function evaluateArcadeShot(
  projectileStart: Point,
  projectileEnd: Point,
  durationMs: number,
  asteroids: readonly ArcadeAsteroid[],
  holdMs: number,
  hitRadius = ARCADE_HIT_RADIUS,
): ArcadeShotEvaluation {
  const collisions: ArcadeShotEvaluation['collisions'] = [];
  let nearest: ArcadeShotEvaluation['nearest'] = null;

  for (const asteroid of asteroids) {
    const segments = projectAsteroidMotion(asteroid, durationMs, holdMs);
    let asteroidNearest: ClosestApproach | null = null;
    let moving = false;
    for (const segment of segments) {
      const approach = closestApproach(projectileStart, projectileEnd, durationMs, segment);
      if (!asteroidNearest || approach.distance < asteroidNearest.distance) {
        asteroidNearest = approach;
        moving = segment.moving;
      }
    }
    if (!asteroidNearest) continue;

    if (!nearest || asteroidNearest.distance < nearest.distance) {
      nearest = {
        asteroidId: asteroid.id,
        distance: asteroidNearest.distance,
        asteroidPoint: asteroidNearest.asteroidPoint,
        projectilePoint: asteroidNearest.projectilePoint,
      };
    }
    if (asteroidNearest.distance <= hitRadius) {
      collisions.push({
        asteroidId: asteroid.id,
        timeMs: asteroidNearest.timeMs,
        point: asteroidNearest.asteroidPoint,
        moving,
        distance: asteroidNearest.distance,
      });
    }
  }

  collisions.sort((a, b) => a.timeMs - b.timeMs);
  return { collisions, nearest };
}
