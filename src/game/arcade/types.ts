import type { Facing } from '../levels/types';
import type { Point } from '../logic/lineMath';

export type ArcadePhase = 'countdown' | 'playing' | 'interwave' | 'gameover';
export type ArcadeAsteroidPhase = 'holding' | 'falling';

export interface ArcadeAsteroid {
  id: string;
  x: number;
  y: number;
  phase: ArcadeAsteroidPhase;
  vertexIndex: number;
  fromY: number;
  toY: number;
  phaseElapsedMs: number;
  phaseDurationMs: number;
}

export interface ArcadeSimulation {
  phase: ArcadePhase;
  countdownMs: number;
  wave: number;
  waveResolved: number;
  waveSpawned: number;
  spawnCooldownMs: number;
  interwaveMs: number;
  shields: number;
  score: number;
  streak: number;
  longestStreak: number;
  destroyed: number;
  shots: number;
  misses: number;
  elapsedMs: number;
  nextAsteroidId: number;
  asteroids: ArcadeAsteroid[];
}

export interface ArcadeEquation {
  m: number;
  b: number;
  facing: Facing;
}

export interface ArcadeShot {
  start: Point;
  end: Point;
  progress: number;
}

export interface ArcadeExplosion {
  id: string;
  point: Point;
}

export interface ArcadeScorePopup {
  id: string;
  point: Point;
  points: number;
}

export interface ArcadeRunStats {
  score: number;
  wave: number;
  longestStreak: number;
  destroyed: number;
  shots: number;
  misses: number;
  durationMs: number;
  endedAt: number;
}

export interface ArcadeRecords {
  highScore: number;
  bestWave: number;
  longestStreak: number;
  totalRuns: number;
  totalDestroyed: number;
  totalPlaytimeMs: number;
  lastRun: ArcadeRunStats | null;
}

export interface MotionSegment {
  startMs: number;
  endMs: number;
  start: Point;
  end: Point;
  moving: boolean;
}

export interface ArcadeCollision {
  asteroidId: string;
  timeMs: number;
  point: Point;
  moving: boolean;
  distance: number;
}

export interface ArcadeShotEvaluation {
  collisions: ArcadeCollision[];
  nearest:
    | {
        asteroidId: string;
        distance: number;
        asteroidPoint: Point;
        projectilePoint: Point;
      }
    | null;
}
