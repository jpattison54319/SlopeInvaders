import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AsteroidSpec } from './levels/types';
import type { LevelEntry } from './levels';
import { evaluateShot } from './logic/hitDetection';
import { lineBoardSegment } from './logic/coordinateTransform';
import { pointsForAsteroid, scoreShot } from './logic/scoring';
import { buildFeedback, type ShotFeedback } from './logic/hints';
import { GameBoard, type ExplosionInstance, type ShotState } from './components/GameBoard';
import { Hud } from './components/Hud';
import { EquationControls } from './components/EquationControls';
import { IconButton } from './components/IconButton';

const BOARD_SIZE = 560;
const SHOT_DURATION_MS = 700;

/** Context for the shot currently animating, kept in a ref to avoid stale closures. */
interface ShotContext {
  seg: { start: { x: number; y: number }; end: { x: number; y: number } };
  startTime: number;
  hits: { asteroid: AsteroidSpec; frac: number }[];
  results: ReturnType<typeof evaluateShot>;
  applied: Set<string>;
  finalized: boolean;
  m: number;
  b: number;
}

interface GameProps {
  entry: LevelEntry;
  onExit: () => void;
  onSettings: () => void;
}

/** The single-level gameplay screen. */
export function Game({ entry, onExit, onSettings }: GameProps) {
  // The router only routes here for playable (config !== null) levels.
  const level = entry.config!;
  const total = level.asteroids.length;
  const asteroidsById = useMemo(
    () => new Map(level.asteroids.map((a) => [a.id, a])),
    [level],
  );

  const [m, setM] = useState(level.defaults.m);
  const [b, setB] = useState(level.defaults.b);
  // x-offset of the cannon (movable ship). Unlocked in later levels; 0 here.
  const [xOffset, setXOffset] = useState(level.defaults.xOffset ?? 0);
  const [destroyed, setDestroyed] = useState<ReadonlySet<string>>(new Set());
  const [score, setScore] = useState(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [feedback, setFeedback] = useState<ShotFeedback | null>(null);
  const [shot, setShot] = useState<ShotState | null>(null);
  const [explosions, setExplosions] = useState<ExplosionInstance[]>([]);

  const shotCtx = useRef<ShotContext | null>(null);
  const rafId = useRef<number | null>(null);

  const remaining = total - destroyed.size;
  const won = remaining === 0;
  const firing = shot !== null;
  // Effective cannon x: the ship rides the line at this x (base + offset).
  const shipX = level.ship.position.x + xOffset;
  // The displayed line y = m(x - xOffset) + b is the same line as
  // y = m·x + bEff, so the whole geometry pipeline uses this single intercept.
  const bEff = b - m * xOffset;

  // Cancel any running animation when the component unmounts.
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const applyHit = useCallback((asteroid: AsteroidSpec) => {
    setDestroyed((prev) => {
      const next = new Set(prev);
      next.add(asteroid.id);
      return next;
    });
    setScore((s) => s + pointsForAsteroid(asteroid));
    setExplosions((prev) => [
      ...prev,
      { id: `${asteroid.id}-${performance.now()}`, point: asteroid.weakPoint },
    ]);
  }, []);

  const finalizeShot = useCallback(
    (ctx: ShotContext) => {
      const destroyedSpecs = ctx.hits.map((h) => h.asteroid);
      // Add the multi-hit bonus on top of the per-hit base points already given.
      if (destroyedSpecs.length > 1) {
        const base = destroyedSpecs.reduce((s, a) => s + pointsForAsteroid(a), 0);
        setScore((s) => s + (scoreShot(destroyedSpecs) - base));
      }
      setFeedback(buildFeedback(ctx.m, ctx.b, ctx.results, asteroidsById));
      setShotsFired((s) => s + 1);
    },
    [asteroidsById],
  );

  const startLoop = useCallback(() => {
    if (rafId.current !== null) return;
    const tick = (now: number) => {
      const ctx = shotCtx.current;
      if (!ctx) {
        rafId.current = null;
        return;
      }
      const t = Math.min(1, (now - ctx.startTime) / SHOT_DURATION_MS);
      setShot((s) => (s ? { ...s, progress: t } : s));

      // Destroy asteroids as the beam sweeps past their x.
      for (const h of ctx.hits) {
        if (t >= h.frac && !ctx.applied.has(h.asteroid.id)) {
          ctx.applied.add(h.asteroid.id);
          applyHit(h.asteroid);
        }
      }

      if (t >= 1 && !ctx.finalized) {
        ctx.finalized = true;
        finalizeShot(ctx);
        shotCtx.current = null;
        setShot(null);
        rafId.current = null;
        return;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
  }, [applyHit, finalizeShot]);

  const handleFire = useCallback(() => {
    if (firing || won) return;

    const alive = level.asteroids.filter((a) => !destroyed.has(a.id));
    const results = evaluateShot(m, bEff, alive, shipX);
    const seg = lineBoardSegment(m, bEff, level.bounds, shipX);

    if (!seg) {
      setFeedback({
        hit: false,
        headline: 'Off the board',
        detail:
          'Your line doesn’t cross the play area from the cannon. Try a smaller y-intercept or a positive slope.',
      });
      setShotsFired((s) => s + 1);
      return;
    }

    const dx = seg.end.x - seg.start.x;
    const hits = results
      .filter((r) => r.hit)
      .map((r) => {
        const asteroid = alive.find((a) => a.id === r.asteroidId)!;
        const frac = dx === 0 ? 1 : (r.weakPoint.x - seg.start.x) / dx;
        return { asteroid, frac: Math.max(0, Math.min(1, frac)) };
      })
      .sort((p, q) => p.frac - q.frac);

    shotCtx.current = {
      seg,
      startTime: performance.now(),
      hits,
      results,
      applied: new Set<string>(),
      finalized: false,
      m,
      b: bEff,
    };
    setFeedback(null);
    setShot({ start: seg.start, end: seg.end, progress: 0 });
    startLoop();
  }, [firing, won, level, destroyed, m, bEff, shipX, startLoop]);

  const handleReset = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    shotCtx.current = null;
    setM(level.defaults.m);
    setB(level.defaults.b);
    setXOffset(level.defaults.xOffset ?? 0);
    setDestroyed(new Set());
    setScore(0);
    setShotsFired(0);
    setFeedback(null);
    setShot(null);
    setExplosions([]);
  }, [level]);

  const handleExplosionDone = useCallback((id: string) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <div className="app">
      <header className="game-bar">
        <IconButton icon="back" label="Back to menu" text="Menu" className="bar-btn" onClick={onExit} />
        <div className="game-bar__title">
          <span className="game-bar__level">Level {entry.number}</span>
          <h1>{level.name}</h1>
        </div>
        <IconButton icon="settings" label="Settings" className="bar-btn" onClick={onSettings} />
      </header>

      <main className="app__main">
        <div className="app__board">
          <GameBoard
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            level={level}
            m={m}
            b={bEff}
            shipX={shipX}
            destroyed={destroyed}
            shot={shot}
            explosions={explosions}
            onExplosionDone={handleExplosionDone}
          />
        </div>

        <aside className="app__sidebar">
          <Hud
            learningGoal={level.learningGoal}
            score={score}
            remaining={remaining}
            total={total}
            shotsFired={shotsFired}
            feedback={feedback}
            won={won}
          />
          <EquationControls
            m={m}
            b={b}
            xOffset={xOffset}
            onChangeM={setM}
            onChangeB={setB}
            onChangeXOffset={setXOffset}
            onFire={handleFire}
            onReset={handleReset}
            disabled={firing}
            won={won}
            controls={level.allowedControls}
            equationForm={level.equationForm}
          />
        </aside>
      </main>

      <footer className="app__footer">
        Level {entry.number} · {level.name} — a Slope Invaders prototype.
      </footer>
    </div>
  );
}
