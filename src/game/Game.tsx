import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AsteroidSpec, LevelConfig } from './levels/types';
import { evaluateShot } from './logic/hitDetection';
import { lineBoardSegment } from './logic/coordinateTransform';
import { pointsForAsteroid, scoreShot } from './logic/scoring';
import { buildFeedback, type ShotFeedback } from './logic/hints';
import { GameBoard, type ExplosionInstance, type ShotState } from './components/GameBoard';
import { Hud } from './components/Hud';
import { EquationControls } from './components/EquationControls';
import { IconButton } from './components/IconButton';
import { Callout } from './components/Callout';
import { Calculator } from './components/Calculator';
import { useSfx } from './audio/sfxContext';
import { scorePerformance, type DifficultyTier, type LevelStats } from './campaign/difficulty';

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

type Outcome = 'playing' | 'won' | 'lost';

interface GameProps {
  level: LevelConfig;
  /** Display title (level name). */
  title: string;
  /** e.g. "Zone 1 · Level 3" or "Tutorial". */
  levelNumberLabel: string;
  /** Whether a next level exists (controls the advance button label). */
  hasNext: boolean;
  /** Difficulty tier this level is being played at (recorded into stats). */
  tier?: DifficultyTier;
  onExit: () => void;
  onSettings: () => void;
  onAdvance: () => void;
  /** Called once when the level is first won, with the full visit stats. */
  onComplete: (levelId: string, stats: LevelStats) => void;
}

/** The single-level gameplay screen. */
export function Game({
  level,
  title,
  levelNumberLabel,
  hasNext,
  tier = 'standard',
  onExit,
  onSettings,
  onAdvance,
  onComplete,
}: GameProps) {
  const total = level.asteroids.length;
  const asteroidsById = useMemo(
    () => new Map(level.asteroids.map((a) => [a.id, a])),
    [level],
  );
  const hasHearts = level.hearts !== undefined;
  const { playLaser, playExplosion } = useSfx();

  const [m, setM] = useState(level.defaults.m);
  const [b, setB] = useState(level.defaults.b);
  // x-offset of the cannon (movable ship). Unlocked in later levels; 0 here.
  const [xOffset, setXOffset] = useState(level.defaults.xOffset ?? 0);
  const [destroyed, setDestroyed] = useState<ReadonlySet<string>>(new Set());
  const [score, setScore] = useState(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [hearts, setHearts] = useState(level.hearts ?? Infinity);
  const [feedback, setFeedback] = useState<ShotFeedback | null>(null);
  const [shot, setShot] = useState<ShotState | null>(null);
  const [explosions, setExplosions] = useState<ExplosionInstance[]>([]);
  const [calcOpen, setCalcOpen] = useState(false);

  const shotCtx = useRef<ShotContext | null>(null);
  const rafId = useRef<number | null>(null);

  // --- stats instrumentation: cumulative across retries within this visit;
  // refs (not state) so they survive handleReset and don't trigger re-renders.
  const shotsRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const offBoardRef = useRef(0);
  const multiHitRef = useRef(0);
  const heartsLostRef = useRef(0);
  const lossesRef = useRef(0);
  const manualResetsRef = useRef(0);
  const calcOpensRef = useRef(0);
  const tweaksRef = useRef(0);
  const mountPerfRef = useRef(0);
  const mountEpochRef = useRef(0);
  const firstShotMsRef = useRef<number | null>(null);
  const firstHitMsRef = useRef<number | null>(null);
  const lostRef = useRef(false);

  const remaining = total - destroyed.size;
  const won = remaining === 0;
  // Win takes precedence over a loss on the same shot.
  const lost = hasHearts && hearts <= 0 && !won;
  const outcome: Outcome = won ? 'won' : lost ? 'lost' : 'playing';
  const firing = shot !== null;
  // Effective cannon x: the ship rides the line at this x (base + offset).
  const shipX = level.ship.position.x + xOffset;
  // The displayed line y = m(x - xOffset) + b is the same line as
  // y = m·x + bEff, so the whole geometry pipeline uses this single intercept.
  const bEff = b - m * xOffset;

  // In sequential levels, the only currently-targetable asteroid (array order).
  const activeAsteroid = level.sequentialTargets
    ? level.asteroids.find((a) => !destroyed.has(a.id))
    : undefined;
  const activeTargetId = activeAsteroid ? activeAsteroid.id : null;

  // Stamp the level start time and cancel any running animation on unmount.
  useEffect(() => {
    mountPerfRef.current = performance.now();
    mountEpochRef.current = Date.now();
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Count each time the player runs out of hearts (a "loss" before winning).
  useEffect(() => {
    if (lost && !lostRef.current) {
      lostRef.current = true;
      lossesRef.current += 1;
    } else if (!lost && lostRef.current) {
      lostRef.current = false;
    }
  }, [lost]);

  // Record completion once when the level is first won (resets on replay).
  const completedRef = useRef(false);
  useEffect(() => {
    if (won && !completedRef.current) {
      completedRef.current = true;
      const startHearts = level.hearts ?? Infinity;
      const shots = shotsRef.current;
      const hits = hitsRef.current;
      const losses = lossesRef.current;
      const manualResets = manualResetsRef.current;
      const partial = {
        levelId: level.id,
        tier,
        targets: total,
        shots,
        hits,
        misses: missesRef.current,
        offBoardShots: offBoardRef.current,
        multiHits: multiHitRef.current,
        accuracy: shots > 0 ? hits / shots : 1,
        startHearts,
        heartsLost: heartsLostRef.current,
        heartsRemaining: hasHearts ? hearts : Infinity,
        losses,
        manualResets,
        attempts: 1 + losses + manualResets,
        passedFirstTry: losses === 0,
        calculatorOpens: calcOpensRef.current,
        tweaks: tweaksRef.current,
        durationMs: performance.now() - mountPerfRef.current,
        timeToFirstShotMs: firstShotMsRef.current,
        timeToFirstHitMs: firstHitMsRef.current,
        firstPlayedAt: mountEpochRef.current,
        completedAt: Date.now(),
      };
      const stats: LevelStats = { ...partial, score: scorePerformance(partial) };
      onComplete(level.id, stats);
    } else if (!won && completedRef.current) {
      completedRef.current = false;
    }
  }, [won, onComplete, level.id, level.hearts, tier, total, hasHearts, hearts]);

  const loseHeart = useCallback(() => {
    if (hasHearts) {
      heartsLostRef.current += 1;
      setHearts((h) => h - 1);
    }
  }, [hasHearts]);

  const applyHit = useCallback(
    (asteroid: AsteroidSpec) => {
      hitsRef.current += 1;
      if (firstHitMsRef.current === null) {
        firstHitMsRef.current = performance.now() - mountPerfRef.current;
      }
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
      playExplosion();
    },
    [playExplosion],
  );

  const finalizeShot = useCallback(
    (ctx: ShotContext) => {
      const destroyedSpecs = ctx.hits.map((h) => h.asteroid);
      // Add the multi-hit bonus on top of the per-hit base points already given.
      if (destroyedSpecs.length > 1) {
        multiHitRef.current += 1;
        const base = destroyedSpecs.reduce((s, a) => s + pointsForAsteroid(a), 0);
        setScore((s) => s + (scoreShot(destroyedSpecs) - base));
      }
      // A shot that destroyed nothing is a miss → costs a heart.
      if (destroyedSpecs.length === 0) {
        missesRef.current += 1;
        loseHeart();
      }
      setFeedback(buildFeedback(ctx.m, ctx.b, ctx.results, asteroidsById));
      setShotsFired((s) => s + 1);
    },
    [asteroidsById, loseHeart],
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
    if (firing || outcome !== 'playing') return;
    shotsRef.current += 1;
    if (firstShotMsRef.current === null) {
      firstShotMsRef.current = performance.now() - mountPerfRef.current;
    }
    playLaser();

    const alive = level.asteroids.filter((a) => !destroyed.has(a.id));
    // Sequential levels: only the active target can be hit; everything else is inert.
    const targetable = level.sequentialTargets
      ? alive.filter((a) => a.id === activeTargetId)
      : alive;
    const results = evaluateShot(m, bEff, targetable, shipX);
    const seg = lineBoardSegment(m, bEff, level.bounds, shipX);

    if (!seg) {
      setFeedback({
        hit: false,
        headline: 'Off the board',
        detail:
          'Your line doesn’t cross the play area from the cannon. Try a smaller slope or y-intercept.',
      });
      setShotsFired((s) => s + 1);
      offBoardRef.current += 1;
      missesRef.current += 1;
      loseHeart();
      return;
    }

    const dx = seg.end.x - seg.start.x;
    const hits = results
      .filter((r) => r.hit)
      .map((r) => {
        const asteroid = targetable.find((a) => a.id === r.asteroidId)!;
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
  }, [
    firing,
    outcome,
    playLaser,
    level,
    destroyed,
    activeTargetId,
    m,
    bEff,
    shipX,
    loseHeart,
    startLoop,
  ]);

  const resetState = useCallback(
    (countAsManual: boolean) => {
      if (countAsManual) manualResetsRef.current += 1;
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
      setHearts(level.hearts ?? Infinity);
      setFeedback(null);
      setShot(null);
      setExplosions([]);
    },
    [level],
  );

  // Manual "Reset Level" / post-win "Replay" count as voluntary resets; a
  // post-loss "Retry" does not (the loss itself already marks the attempt).
  const handleReset = useCallback(() => resetState(true), [resetState]);
  const handleRetry = useCallback(() => resetState(false), [resetState]);

  // Wrap the equation setters so we can record a coarse "tweaks" engagement
  // count. (Not used by scoring — purely for the future profile page.)
  const handleChangeM = useCallback((v: number) => {
    tweaksRef.current += 1;
    setM(v);
  }, []);
  const handleChangeB = useCallback((v: number) => {
    tweaksRef.current += 1;
    setB(v);
  }, []);
  const handleChangeXOffset = useCallback((v: number) => {
    tweaksRef.current += 1;
    setXOffset(v);
  }, []);

  const toggleCalculator = useCallback(() => {
    setCalcOpen((open) => {
      if (!open) calcOpensRef.current += 1; // free tool: counted, never scored
      return !open;
    });
  }, []);

  const handleExplosionDone = useCallback((id: string) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const showWinOverlay = outcome === 'won';
  const showLoseOverlay = outcome === 'lost';

  return (
    <div className="app">
      <header className="game-bar">
        <IconButton icon="back" label="Back to levels" className="bar-btn chrome-icon-btn" onClick={onExit} />
        <div className="game-bar__title">
          <span className="game-bar__level">{levelNumberLabel}</span>
          <h1>{title}</h1>
        </div>
        <div className="game-bar__right">
          <button
            type="button"
            className="bar-btn calc-btn"
            aria-label="Calculator"
            aria-pressed={calcOpen}
            title="Calculator"
            onClick={toggleCalculator}
          >
            <span className="calc-btn__glyph" aria-hidden="true">🧮</span>
          </button>
          <IconButton icon="settings" label="Settings" className="bar-btn chrome-icon-btn" onClick={onSettings} />
        </div>
      </header>

      {level.callout && <Callout text={level.callout} />}

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
            trajectoryPreview={level.trajectoryPreview}
            trajectoryStyle={level.trajectoryStyle}
            showCoordinates={level.showCoordinates}
            activeTargetId={activeTargetId}
          />

          {showWinOverlay && (
            <div className="game-overlay" role="dialog" aria-label="Level complete">
              <div className="game-overlay__panel game-overlay__panel--win">
                <strong>Level Complete!</strong>
                <p>
                  Cleared in {shotsFired} shot{shotsFired === 1 ? '' : 's'} · Score {score}
                </p>
                <div className="game-overlay__actions">
                  <button type="button" className="btn btn--fire" onClick={onAdvance}>
                    {hasNext ? '▶ Next Level' : '✓ Continue'}
                  </button>
                  <button type="button" className="btn btn--reset" onClick={handleReset}>
                    ↺ Replay
                  </button>
                </div>
              </div>
            </div>
          )}

          {showLoseOverlay && (
            <div className="game-overlay" role="dialog" aria-label="Out of hearts">
              <div className="game-overlay__panel game-overlay__panel--lose">
                <strong>Out of Hearts</strong>
                <p>Your cannon’s shields are down. Try again!</p>
                <div className="game-overlay__actions">
                  <button type="button" className="btn btn--fire" onClick={handleRetry}>
                    ↺ Retry
                  </button>
                  <button type="button" className="btn btn--reset" onClick={onExit}>
                    ← Levels
                  </button>
                </div>
              </div>
            </div>
          )}

          {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
        </div>

        <aside className="app__sidebar">
          <Hud
            learningGoal={level.learningGoal}
            score={score}
            remaining={remaining}
            total={total}
            shotsFired={shotsFired}
            feedback={feedback}
            won={outcome === 'won'}
            hearts={hasHearts ? hearts : undefined}
            maxHearts={hasHearts ? level.hearts : undefined}
          />
          <EquationControls
            m={m}
            b={b}
            xOffset={xOffset}
            onChangeM={handleChangeM}
            onChangeB={handleChangeB}
            onChangeXOffset={handleChangeXOffset}
            onFire={handleFire}
            onReset={handleReset}
            disabled={firing || outcome !== 'playing'}
            won={outcome !== 'playing'}
            controls={level.allowedControls}
            equationForm={level.equationForm}
          />
        </aside>
      </main>

      <footer className="app__footer">
        {levelNumberLabel} · {title} — Slope Invaders
      </footer>
    </div>
  );
}
