import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../components/Modal';
import { CoachPanel } from '../components/CoachPanel';
import { EquationControls } from '../components/EquationControls';
import { TacticalButton } from '../components/TacticalButton';
import {
  TacticalPanel,
  TacticalProgress,
  TacticalStatusRail,
} from '../components/TacticalPanel';
import {
  DEFAULT_KEYBINDINGS,
  findActionForKey,
  normalizeKey,
  type KeyBindings,
} from '../controls/keybindings';
import type { Facing } from '../levels/types';
import { lineBoardSegment } from '../logic/coordinateTransform';
import { useSfx } from '../audio/sfxContext';
import { ArcadeBoard } from './ArcadeBoard';
import { evaluateArcadeShot } from './collision';
import {
  ARCADE_SHOT_MS,
  ARCADE_THREATS_PER_WAVE,
  difficultyForWave,
} from './difficulty';
import {
  createArcadeSimulation,
  endArcadeRun,
  recordArcadeShot,
  stepArcadeSimulation,
} from './simulation';
import { multiplierForStreak, scoreArcadeHit } from './scoring';
import type {
  ArcadeCollision,
  ArcadeExplosion,
  ArcadeRecords,
  ArcadeRunStats,
  ArcadeScorePopup,
  ArcadeShot,
  ArcadeSimulation,
} from './types';

const BOARD_SIZE = 620;

interface ArcadeGameProps {
  records: ArcadeRecords;
  keyBindings?: KeyBindings;
  keyboardEnabled?: boolean;
  externallyPaused?: boolean;
  reducedMotion?: boolean;
  onOpenSettings: () => void;
  onRecordRun: (run: ArcadeRunStats) => void;
  onExit: () => void;
}

interface ShotContext {
  elapsedMs: number;
  collisions: ArcadeCollision[];
  nearest: ReturnType<typeof evaluateArcadeShot>['nearest'];
  resolved: boolean;
  exploded: Set<string>;
  pointsByAsteroid: Map<string, number>;
}

type FeedbackTone = 'neutral' | 'success' | 'warning';

function isTyping(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
}

function missFeedback(nearest: ShotContext['nearest']): string {
  if (!nearest) return 'No target crossed that firing path. Bring the line back onto the grid.';
  const vertical = nearest.projectilePoint.y - nearest.asteroidPoint.y;
  const direction = Math.abs(vertical) < 0.1 ? 'beside' : vertical > 0 ? 'above' : 'below';
  return `Nearest approach: ${nearest.distance.toFixed(1)} units. Your line passed ${direction} the target near (${nearest.asteroidPoint.x.toFixed(1)}, ${nearest.asteroidPoint.y.toFixed(1)}). Adjust m or b and try again.`;
}

export function ArcadeGame({
  records,
  keyBindings = DEFAULT_KEYBINDINGS,
  keyboardEnabled = true,
  externallyPaused = false,
  reducedMotion = false,
  onOpenSettings,
  onRecordRun,
  onExit,
}: ArcadeGameProps) {
  const { playExplosion, playLaser } = useSfx();
  const [simulation, setSimulation] = useState<ArcadeSimulation>(createArcadeSimulation);
  const [m, setM] = useState(1);
  const [b, setB] = useState(0);
  const [facing, setFacing] = useState<Facing>('right');
  const [shot, setShot] = useState<ArcadeShot | null>(null);
  const [explosions, setExplosions] = useState<ArcadeExplosion[]>([]);
  const [scorePopups, setScorePopups] = useState<ArcadeScorePopup[]>([]);
  const [manualPaused, setManualPaused] = useState(false);
  const [baselineHighScore, setBaselineHighScore] = useState(records.highScore);
  const [documentHidden, setDocumentHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden,
  );
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: FeedbackTone;
    headline: string;
    detail: string;
  }>({
    tone: 'neutral',
    headline: 'Targets inbound.',
    detail: 'Read the coordinate, build the equation, and intercept before the asteroid breaches.',
  });

  const simulationRef = useRef(simulation);
  const shotContextRef = useRef<ShotContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const recordedRunRef = useRef(false);
  const previousShieldsRef = useRef(simulation.shields);

  const paused =
    manualPaused ||
    externallyPaused ||
    documentHidden ||
    endConfirmOpen;
  const difficulty = difficultyForWave(simulation.wave);
  const firing = shot !== null;
  const fireM = facing === 'right' ? m : -m;
  const fireB = b;

  useEffect(() => {
    simulationRef.current = simulation;
  }, [simulation]);

  useEffect(() => {
    const onVisibility = () => setDocumentHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (simulation.shields < previousShieldsRef.current) {
      setFeedback({
        tone: 'warning',
        headline: 'Grid breach!',
        detail: `${simulation.shields} shield${simulation.shields === 1 ? '' : 's'} remaining. Missed shots reset the streak, but only a breach damages shields.`,
      });
    }
    previousShieldsRef.current = simulation.shields;
  }, [simulation.shields]);

  useEffect(() => {
    const tick = (now: number) => {
      const previous = lastFrameRef.current ?? now;
      lastFrameRef.current = now;
      const deltaMs = Math.min(250, Math.max(0, now - previous));

      if (!paused) {
        setSimulation((current) => stepArcadeSimulation(current, deltaMs));

        const context = shotContextRef.current;
        if (context) {
          context.elapsedMs += deltaMs;
          const progress = Math.min(1, context.elapsedMs / ARCADE_SHOT_MS);
          setShot((current) => (current ? { ...current, progress } : current));

          for (const collision of context.collisions) {
            if (
              collision.timeMs <= context.elapsedMs &&
              !context.exploded.has(collision.asteroidId)
            ) {
              context.exploded.add(collision.asteroidId);
              setExplosions((current) => [
                ...current,
                {
                  id: `${collision.asteroidId}-${now}`,
                  point: collision.point,
                },
              ]);
              setScorePopups((current) => [
                ...current,
                {
                  id: `${collision.asteroidId}-score-${now}`,
                  point: collision.point,
                  points: context.pointsByAsteroid.get(collision.asteroidId) ?? 100,
                },
              ]);
              playExplosion();
            }
          }

          if (!context.resolved && context.collisions.length > 0 && context.elapsedMs >= context.collisions[0].timeMs) {
            context.resolved = true;
            setSimulation((current) =>
              recordArcadeShot(
                current,
                context.collisions.map((collision) => ({
                  asteroidId: collision.asteroidId,
                  score: { moving: collision.moving },
                })),
              ),
            );
            const movingCount = context.collisions.filter((collision) => collision.moving).length;
            setFeedback({
              tone: 'success',
              headline: context.collisions.length > 1 ? 'Multi-hit intercept!' : 'Direct hit!',
              detail: `${context.collisions.length} asteroid${context.collisions.length === 1 ? '' : 's'} destroyed${movingCount > 0 ? `, including ${movingCount} mid-fall bonus` : ''}. Keep the streak alive.`,
            });
          }

          if (context.elapsedMs >= ARCADE_SHOT_MS) {
            if (!context.resolved) {
              setSimulation((current) => recordArcadeShot(current, []));
              setFeedback({
                tone: 'warning',
                headline: 'Missed intercept.',
                detail: missFeedback(context.nearest),
              });
            }
            shotContextRef.current = null;
            setShot(null);
          }
        }
      } else {
        lastFrameRef.current = now;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [paused, playExplosion]);

  useEffect(() => {
    if (simulation.phase !== 'gameover' || recordedRunRef.current) return;
    recordedRunRef.current = true;
    onRecordRun({
      score: simulation.score,
      wave: simulation.wave,
      longestStreak: simulation.longestStreak,
      destroyed: simulation.destroyed,
      shots: simulation.shots,
      misses: simulation.misses,
      durationMs: simulation.elapsedMs,
      endedAt: Date.now(),
    });
  }, [onRecordRun, simulation]);

  const handleFire = useCallback(() => {
    const current = simulationRef.current;
    if (paused || firing || current.phase !== 'playing' || current.asteroids.length === 0) return;
    const raw = lineBoardSegment(fireM, fireB, {
      minX: -8,
      maxX: 8,
      minY: -8,
      maxY: 8,
    }, 0, facing);
    playLaser();

    if (!raw) {
      setSimulation((state) => recordArcadeShot(state, []));
      setFeedback({
        tone: 'warning',
        headline: 'Off the board.',
        detail: 'That equation does not cross the firing side of the grid. Reduce the slope or intercept.',
      });
      return;
    }

    const segment = facing === 'left' ? { start: raw.end, end: raw.start } : raw;
    const evaluation = evaluateArcadeShot(
      segment.start,
      segment.end,
      ARCADE_SHOT_MS,
      current.asteroids,
      difficultyForWave(current.wave).holdMs,
    );
    const scoreResult = scoreArcadeHit(
      current.streak,
      evaluation.collisions.map((collision) => ({ moving: collision.moving })),
    );
    shotContextRef.current = {
      elapsedMs: 0,
      collisions: evaluation.collisions,
      nearest: evaluation.nearest,
      resolved: false,
      exploded: new Set(),
      pointsByAsteroid: new Map(
        evaluation.collisions.map((collision, index) => [
          collision.asteroidId,
          scoreResult.awards[index] ?? 100,
        ]),
      ),
    };
    setShot({ start: segment.start, end: segment.end, progress: 0 });
  }, [facing, fireB, fireM, firing, paused, playLaser]);

  const changeM = useCallback((value: number) => setM(value), []);
  const changeB = useCallback((value: number) => setB(value), []);

  useEffect(() => {
    if (!keyboardEnabled) return;
    const round = (value: number) => Math.round(value * 100) / 100;
    const onKey = (event: KeyboardEvent) => {
      if (isTyping()) return;
      if (event.key === 'Escape' && !externallyPaused && simulation.phase !== 'gameover') {
        setManualPaused((value) => !value);
        event.preventDefault();
        return;
      }
      if (paused || firing || simulation.phase !== 'playing') return;
      const action = findActionForKey(keyBindings, normalizeKey(event));
      if (!action) return;
      switch (action) {
        case 'fire':
          handleFire();
          break;
        case 'slopeUp':
          changeM(round(m + 0.5));
          break;
        case 'slopeDown':
          changeM(round(m - 0.5));
          break;
        case 'yInterceptUp':
          changeB(round(b + 0.5));
          break;
        case 'yInterceptDown':
          changeB(round(b - 0.5));
          break;
        case 'faceLeft':
          setFacing('left');
          break;
        case 'faceRight':
          setFacing('right');
          break;
        case 'xOffsetUp':
        case 'xOffsetDown':
          return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    b,
    changeB,
    changeM,
    externallyPaused,
    firing,
    handleFire,
    keyBindings,
    keyboardEnabled,
    m,
    paused,
    simulation.phase,
  ]);

  const endRun = useCallback(() => {
    setEndConfirmOpen(false);
    setManualPaused(false);
    setSimulation((current) => endArcadeRun(current));
  }, []);

  const replay = useCallback(() => {
    recordedRunRef.current = false;
    setBaselineHighScore(records.highScore);
    previousShieldsRef.current = 3;
    shotContextRef.current = null;
    setSimulation(createArcadeSimulation());
    setM(1);
    setB(0);
    setFacing('right');
    setShot(null);
    setExplosions([]);
    setScorePopups([]);
    setManualPaused(false);
    setFeedback({
      tone: 'neutral',
      headline: 'Targets inbound.',
      detail: 'Read the coordinate, build the equation, and intercept before the asteroid breaches.',
    });
  }, [records.highScore]);

  const removeExplosion = useCallback((id: string) => {
    setExplosions((current) => current.filter((explosion) => explosion.id !== id));
  }, []);

  const removeScorePopup = useCallback((id: string) => {
    setScorePopups((current) => current.filter((popup) => popup.id !== id));
  }, []);

  const countdownNumber =
    simulation.phase === 'countdown' ? Math.max(1, Math.ceil(simulation.countdownMs / 1000)) : null;
  const newHighScore =
    simulation.phase === 'gameover' && simulation.score > baselineHighScore;
  const accuracy =
    simulation.shots > 0
      ? Math.round(((simulation.shots - simulation.misses) / simulation.shots) * 100)
      : 100;
  const shieldLabel = `${simulation.shields} of 3 shields remaining`;

  const feedbackPanel = useMemo(
    () => (
      <CoachPanel title="Mission Control" tone={feedback.tone} compact>
        <strong>{feedback.headline}</strong>
        <p>{feedback.detail}</p>
      </CoachPanel>
    ),
    [feedback],
  );

  return (
    <div className="app arcade-game">
      <header className="game-bar arcade-game__bar">
        <TacticalButton
          asset="back"
          label="End run"
          size="small"
          className="bar-btn"
          onClick={() => setEndConfirmOpen(true)}
        />
        <div className="game-bar__title">
          <span className="game-bar__level">Endless Equation Defense</span>
          <h1>Arcade Run</h1>
        </div>
        <div className="game-bar__right">
          <button
            type="button"
            className="arcade-icon-command"
            aria-label={manualPaused ? 'Resume run' : 'Pause run'}
            title={manualPaused ? 'Resume run' : 'Pause run'}
            onClick={() => setManualPaused((value) => !value)}
          >
            {manualPaused ? '▶' : 'Ⅱ'}
          </button>
          <TacticalButton
            asset="settings"
            label="Settings"
            size="small"
            className="bar-btn"
            onClick={onOpenSettings}
          />
        </div>
      </header>

      <main className="arcade-game__main">
        <section className="arcade-game__board-column" aria-label="Arcade coordinate grid">
          <div className="app__board arcade-game__board">
            <ArcadeBoard
              width={BOARD_SIZE}
              height={BOARD_SIZE}
              asteroids={simulation.asteroids}
              holdMs={difficulty.holdMs}
              m={fireM}
              b={fireB}
              facing={facing}
              shot={shot}
              explosions={explosions}
              scorePopups={scorePopups}
              reducedMotion={reducedMotion}
              onExplosionDone={removeExplosion}
              onScorePopupDone={removeScorePopup}
            />

            {countdownNumber !== null && (
              <div className="arcade-game__state-overlay" role="status" aria-live="polite">
                <strong>{countdownNumber}</strong>
                <span>Prepare equation systems</span>
              </div>
            )}

            {simulation.phase === 'interwave' && (
              <div className="arcade-game__state-overlay" role="status">
                <strong>Wave {simulation.wave + 1}</strong>
                <span>Incoming</span>
              </div>
            )}

            {paused && simulation.phase !== 'gameover' && !externallyPaused && (
              <div className="arcade-game__state-overlay" role="dialog" aria-label="Run paused">
                <strong>Paused</strong>
                <TacticalButton
                  asset="play"
                  label="Resume run"
                  text="Resume"
                  size="large"
                  onClick={() => {
                    setEndConfirmOpen(false);
                    setManualPaused(false);
                  }}
                />
              </div>
            )}
          </div>

          <TacticalPanel className="arcade-hold-meter">
            <span>Vertex Hold</span>
            <TacticalProgress
              value={difficulty.holdMs}
              max={5000}
              tone={difficulty.holdMs <= 3250 ? 'gold' : 'green'}
              label={`${(difficulty.holdMs / 1000).toFixed(2)} second vertex hold`}
            />
            <strong>{(difficulty.holdMs / 1000).toFixed(2)}s</strong>
          </TacticalPanel>
        </section>

        <aside className="arcade-game__sidebar">
          <div className="arcade-shields" role="img" aria-label={shieldLabel}>
            <span>Shields</span>
            <div>
              {Array.from({ length: 3 }, (_, index) => (
                <span
                  key={index}
                  className={`arcade-shield-icon ${
                    index < simulation.shields ? '' : 'arcade-shield-icon--empty'
                  }`.trim()}
                />
              ))}
            </div>
          </div>

          <TacticalStatusRail
            className="arcade-game__stats"
            label="Arcade run statistics"
            items={[
              { label: 'Score', value: simulation.score },
              { label: 'Best', value: Math.max(records.highScore, simulation.score) },
              { label: 'Wave', value: simulation.wave },
              {
                label: 'Streak',
                value:
                  simulation.streak > 0
                    ? `${simulation.streak} · x${multiplierForStreak(simulation.streak)}`
                    : '—',
              },
            ]}
          />

          <TacticalPanel className="arcade-wave-progress">
            <div>
              <span>Wave Progress</span>
              <strong>
                {simulation.waveResolved} / {ARCADE_THREATS_PER_WAVE}
              </strong>
            </div>
            <TacticalProgress
              value={simulation.waveResolved}
              max={ARCADE_THREATS_PER_WAVE}
              tone="green"
              label={`${simulation.waveResolved} of ${ARCADE_THREATS_PER_WAVE} threats resolved this wave`}
            />
          </TacticalPanel>

          <div className="arcade-game__feedback">{feedbackPanel}</div>

          <EquationControls
            m={m}
            b={b}
            xOffset={0}
            facing={facing}
            onChangeM={changeM}
            onChangeB={changeB}
            onChangeXOffset={() => {}}
            onChangeFacing={setFacing}
            onFire={handleFire}
            onReset={() => setEndConfirmOpen(true)}
            disabled={paused || firing || simulation.phase !== 'playing'}
            won={simulation.phase === 'gameover'}
            controls={['slope', 'yIntercept', 'direction']}
            equationForm="y=mx+b"
            secondaryLabel="End run"
            secondaryText="End Run"
            secondaryAsset="back"
            secondaryClassName="arcade-control-end"
          />
        </aside>
      </main>

      {endConfirmOpen && simulation.phase !== 'gameover' && (
        <Modal title="End Arcade Run?" onClose={() => setEndConfirmOpen(false)}>
          <CoachPanel tone="warning">
            <p>Your current score will be saved to your personal Arcade records.</p>
          </CoachPanel>
          <div className="arcade-confirm-actions">
            <TacticalButton
              asset="back"
              label="Keep playing"
              text="Keep Playing"
              size="large"
              onClick={() => setEndConfirmOpen(false)}
            />
            <TacticalButton
              asset="confirm"
              label="End run now"
              text="End Run"
              size="large"
              onClick={endRun}
            />
          </div>
        </Modal>
      )}

      {simulation.phase === 'gameover' && (
        <div className="game-overlay" role="dialog" aria-label="Arcade run complete">
          <div className="game-overlay__panel arcade-results">
            <span className="menu__panel-label">
              {simulation.shields === 0 ? 'Shields Depleted' : 'Run Ended'}
            </span>
            <strong>{newHighScore ? 'New High Score!' : 'Arcade Debrief'}</strong>
            <p>
              Wave {simulation.wave} · {simulation.destroyed} asteroids intercepted
            </p>
            <TacticalStatusRail
              label="Arcade result"
              items={[
                { label: 'Score', value: simulation.score },
                { label: 'Accuracy', value: `${accuracy}%` },
                { label: 'Best Streak', value: simulation.longestStreak || '—' },
              ]}
            />
            <div className="game-overlay__actions">
              <TacticalButton
                asset="replay"
                label="Replay Arcade"
                text="Replay"
                size="large"
                onClick={replay}
              />
              <TacticalButton
                asset="back"
                label="Back to modes"
                text="Modes"
                size="large"
                onClick={onExit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
