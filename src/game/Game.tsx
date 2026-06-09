import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AsteroidSpec, Facing, LevelConfig } from './levels/types';
import {
  DEFAULT_KEYBINDINGS,
  findActionForKey,
  normalizeKey,
  type KeyBindings,
} from './controls/keybindings';
import {
  evaluateShot,
  firstWallHit,
  firstFriendlyHit,
  hitsFriendly,
  resolveDestroyed,
  DEFAULT_HIT_TOLERANCE,
} from './logic/hitDetection';
import type { Point } from './logic/lineMath';
import { lineBoardSegment } from './logic/coordinateTransform';
import { pointsForAsteroid, scoreShot } from './logic/scoring';
import { buildFeedback, type ShotFeedback } from './logic/hints';
import { GameBoard, type ExplosionInstance, type ShotState } from './components/GameBoard';
import { Hud } from './components/Hud';
import { EquationControls } from './components/EquationControls';
import { IconButton } from './components/IconButton';
import { Calculator } from './components/Calculator';
import { GuidedTour, type TourStep } from './components/GuidedTour';
import { CalculatorIcon } from './components/CalculatorIcon';
import { VictoryOverlay } from './components/VictoryOverlay';
import { useSfx } from './audio/sfxContext';
import { scorePerformance, type DifficultyTier, type LevelStats } from './campaign/difficulty';
import { starsForCompletedStats, type StarCount } from './campaign/stars';

const BOARD_SIZE = 560;
const SHOT_DURATION_MS = 700;

const TOUR_SEEN_KEY = 'slope-invaders:tour-seen';

/** The guided-tour walkthrough shown the first time the Tutorial is opened. */
const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="grid"]',
    title: 'The Grid',
    body: 'This is your coordinate plane. Your cannon sits at the origin and asteroids float on the grid — read each one by its (x, y) position.',
  },
  {
    selector: '[data-tour="mission"]',
    title: 'Your Mission',
    body: 'Every level shows its objective here. It tells you exactly what to aim for and which controls you have.',
  },
  {
    selector: '[data-tour="hearts"]',
    title: 'Your Hearts',
    body: 'These are your lives. Each missed shot costs one heart — run out and the level restarts. Take your time and aim carefully.',
  },
  {
    selector: '[data-tour="stats"]',
    title: 'Score & Progress',
    body: 'Track your Score, how many Asteroids are left to clear, and the number of Shots you have fired so far.',
  },
  {
    selector: '[data-tour="hint"]',
    title: 'Hints & Feedback',
    body: 'After each shot this panel tells you whether you hit and nudges you toward the fix — read it to learn from every attempt.',
  },
  {
    selector: '[data-tour="command"]',
    title: 'Command Center',
    body: 'Change the equation here to aim the dashed line, press Fire to shoot, and use Reset Level to start the level over any time.',
  },
  {
    selector: null,
    title: 'Ready to begin?',
    body: 'That is everything! Raise the slope until the dashed line lands on the asteroid, then Fire. Good luck, pilot.',
  },
];

function tourSeen(levelId: string): boolean {
  try {
    return localStorage.getItem(`${TOUR_SEEN_KEY}:${levelId}`) === '1';
  } catch {
    return false;
  }
}

function markTourSeen(levelId: string): void {
  try {
    localStorage.setItem(`${TOUR_SEEN_KEY}:${levelId}`, '1');
  } catch {
    /* ignore storage failures */
  }
}

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
  /** The shot destroyed nothing because a wall stood in the way. */
  blocked: boolean;
  /** Linked groups this shot clipped but didn't fully clear (all-or-none). */
  partialGroups: string[];
  /** The shot crossed a friendly ship, so it was scrubbed (Zone 7). */
  friendlyScrub: boolean;
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
  /** Current key map for keyboard controls. */
  keyBindings?: KeyBindings;
  /** Disable keyboard controls (e.g. while the settings modal is open). */
  keyboardEnabled?: boolean;
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
  keyBindings = DEFAULT_KEYBINDINGS,
  keyboardEnabled = true,
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
  // Facing direction: the shot only travels this way (Zone 4). Defaults right.
  const [facing, setFacing] = useState<Facing>(level.defaults.facing ?? 'right');
  const [destroyed, setDestroyed] = useState<ReadonlySet<string>>(new Set());
  const [score, setScore] = useState(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [hearts, setHearts] = useState(level.hearts ?? Infinity);
  const [feedback, setFeedback] = useState<ShotFeedback | null>(null);
  const [shot, setShot] = useState<ShotState | null>(null);
  const [explosions, setExplosions] = useState<ExplosionInstance[]>([]);
  const [calcOpen, setCalcOpen] = useState(false);
  const [earnedStars, setEarnedStars] = useState<StarCount>(0);
  // Show the spotlight walkthrough on the first visit to a guided level.
  const [showTour, setShowTour] = useState(
    () => Boolean(level.guidedTour) && !tourSeen(level.id),
  );

  const closeTour = useCallback(() => {
    setShowTour(false);
    markTourSeen(level.id);
  }, [level.id]);

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
  // Facing mirrors the aim across the ship: facing right fires y = m·x + bEff,
  // facing left fires its mirror y = -m·x + bEff' (so a positive slope tilts up
  // whichever way you face). The board, equation, and shot all use this line.
  const fireM = facing === 'right' ? m : -m;
  const fireB = bEff + shipX * (m - fireM);

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
      setEarnedStars(starsForCompletedStats(stats));
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
      // Feedback precedence when nothing was destroyed: a friendly ship in the
      // line, then a wall, then a half-cleared chain, then the generic hint.
      let feedbackForShot: ShotFeedback;
      if (destroyedSpecs.length === 0 && ctx.friendlyScrub) {
        feedbackForShot = {
          hit: false,
          headline: 'Friendly ship!',
          detail:
            'Your line of fire crossed a friendly ship, so the shot was scrubbed. Pick a different line that reaches the asteroid without passing through an ally.',
        };
      } else if (destroyedSpecs.length === 0 && ctx.blocked) {
        feedbackForShot = {
          hit: false,
          headline: 'Blocked!',
          detail:
            'A shield wall stopped your shot. Change the slope or y-intercept so your line reaches the asteroid without crossing a wall.',
        };
      } else if (destroyedSpecs.length === 0 && ctx.partialGroups.length > 0) {
        feedbackForShot = {
          hit: false,
          headline: 'Chained!',
          detail:
            'Those rocks are linked — one line has to pass through every chained rock at once. You only lined up part of the chain.',
        };
      } else {
        feedbackForShot = buildFeedback(ctx.m, ctx.b, ctx.results, asteroidsById);
      }
      setFeedback(feedbackForShot);
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
    // The shot flies out of the ship along the effective (facing-mirrored) line.
    const results = evaluateShot(
      fireM,
      fireB,
      targetable,
      shipX,
      DEFAULT_HIT_TOLERANCE,
      facing,
      level.walls,
    );
    const friendlies = level.friendlies ?? [];
    // A friendly ship anywhere in the line of fire scrubs the whole shot (Zone 7).
    const friendlyScrub = friendlies.some((f) =>
      hitsFriendly(fireM, fireB, f, shipX, DEFAULT_HIT_TOLERANCE, facing, level.walls),
    );
    // Linked groups are all-or-none: a half-clipped chain destroys nothing (Zone 6).
    const { destroyedIds, partialGroups } = resolveDestroyed(results, targetable);
    const rawSeg = lineBoardSegment(fireM, fireB, level.bounds, shipX, facing);

    if (!rawSeg) {
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

    // The clip returns start at the smaller x; when facing left the ship is the
    // larger-x end, so flip it so the beam leaves the ship and travels outward.
    const oriented = facing === 'left' ? { start: rawSeg.end, end: rawSeg.start } : rawSeg;
    // Stop the beam at the first obstacle it reaches — a shield wall or a friendly
    // ship (blocked asteroids beyond a wall are already hit:false; a scrubbed shot
    // destroys nothing) — so the laser visibly halts at whatever it strikes.
    const wallPt = firstWallHit(oriented.start, oriented.end, level.walls);
    const friendlyPt = firstFriendlyHit(oriented.start, oriented.end, friendlies, DEFAULT_HIT_TOLERANCE);
    const stops = [wallPt, friendlyPt].filter((p): p is Point => p !== null);
    const distSq = (p: Point) =>
      (p.x - oriented.start.x) ** 2 + (p.y - oriented.start.y) ** 2;
    const stop = stops.length ? stops.reduce((a, c) => (distSq(c) < distSq(a) ? c : a)) : null;
    const seg = stop ? { start: oriented.start, end: stop } : oriented;

    // A friendly in the line scrubs every hit; otherwise apply the all-or-none set.
    const effectiveHits = friendlyScrub ? new Set<string>() : destroyedIds;
    const dx = seg.end.x - seg.start.x;
    const hits = results
      .filter((r) => effectiveHits.has(r.asteroidId))
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
      m: fireM,
      b: fireB,
      blocked: hits.length === 0 && results.some((r) => r.blocked),
      partialGroups,
      friendlyScrub,
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
    fireM,
    fireB,
    shipX,
    facing,
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
      setFacing(level.defaults.facing ?? 'right');
      setDestroyed(new Set());
      setScore(0);
      setShotsFired(0);
      setHearts(level.hearts ?? Infinity);
      setFeedback(null);
      setShot(null);
      setExplosions([]);
      setEarnedStars(0);
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
  const handleChangeFacing = useCallback((v: Facing) => {
    tweaksRef.current += 1;
    setFacing(v);
  }, []);

  // Keyboard controls: drive the equation/facing handlers from the bound keys.
  // Ignored while typing in an input, while a shot animates / the level is over,
  // or when disabled (e.g. the settings modal is open). Each action is gated by
  // the level's allowedControls so it does nothing the on-screen controls can't.
  useEffect(() => {
    if (!keyboardEnabled) return;
    const round = (v: number) => Math.round(v * 100) / 100;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (firing || outcome !== 'playing') return;
      const action = findActionForKey(keyBindings, normalizeKey(e));
      if (!action) return;
      const allowed = level.allowedControls;
      switch (action) {
        case 'fire':
          handleFire();
          break;
        case 'slopeUp':
          if (allowed.includes('slope')) handleChangeM(round(m + 0.5));
          break;
        case 'slopeDown':
          if (allowed.includes('slope')) handleChangeM(round(m - 0.5));
          break;
        case 'yInterceptUp':
          if (allowed.includes('yIntercept')) handleChangeB(round(b + 0.5));
          break;
        case 'yInterceptDown':
          if (allowed.includes('yIntercept')) handleChangeB(round(b - 0.5));
          break;
        case 'xOffsetUp':
          if (allowed.includes('xOffset')) handleChangeXOffset(round(xOffset + 1));
          break;
        case 'xOffsetDown':
          if (allowed.includes('xOffset')) handleChangeXOffset(round(xOffset - 1));
          break;
        case 'faceLeft':
          if (allowed.includes('direction')) handleChangeFacing('left');
          break;
        case 'faceRight':
          if (allowed.includes('direction')) handleChangeFacing('right');
          break;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    keyboardEnabled,
    keyBindings,
    firing,
    outcome,
    m,
    b,
    xOffset,
    level.allowedControls,
    handleFire,
    handleChangeM,
    handleChangeB,
    handleChangeXOffset,
    handleChangeFacing,
  ]);

  const toggleCalculator = useCallback(() => {
    setCalcOpen((open) => {
      if (!open) calcOpensRef.current += 1; // free tool: counted, never scored
      return !open;
    });
  }, []);

  const handleExplosionDone = useCallback((id: string) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const showWinOverlay = outcome === 'won' && earnedStars > 0;
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
            className="bar-btn chrome-icon-btn calc-btn"
            aria-label="Calculator"
            aria-pressed={calcOpen}
            title="Calculator"
            onClick={toggleCalculator}
          >
            <CalculatorIcon className="calc-btn__icon" />
          </button>
          <IconButton icon="settings" label="Settings" className="bar-btn chrome-icon-btn" onClick={onSettings} />
        </div>
      </header>

      <div className="mission-banner" data-tour="mission" role="note">
        <span className="mission-banner__label">Mission</span>
        <p>{level.learningGoal}</p>
      </div>

      <main className="app__main">
        <div className="app__board" data-tour="grid">
          <GameBoard
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            level={level}
            m={fireM}
            b={fireB}
            shipX={shipX}
            destroyed={destroyed}
            shot={shot}
            explosions={explosions}
            onExplosionDone={handleExplosionDone}
            trajectoryPreview={level.trajectoryPreview}
            trajectoryStyle={level.trajectoryStyle}
            showCoordinates={level.showCoordinates}
            activeTargetId={activeTargetId}
            facing={facing}
            bidirectional={level.allowedControls.includes('direction')}
          />

          {showWinOverlay && (
            <VictoryOverlay
              shotsFired={shotsFired}
              score={score}
              stars={earnedStars}
              hasNext={hasNext}
              onAdvance={onAdvance}
              onReplay={handleReset}
            />
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
            facing={facing}
            onChangeM={handleChangeM}
            onChangeB={handleChangeB}
            onChangeXOffset={handleChangeXOffset}
            onChangeFacing={handleChangeFacing}
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

      {showTour && <GuidedTour steps={TOUR_STEPS} onClose={closeTour} />}
    </div>
  );
}
