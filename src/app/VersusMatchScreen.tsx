import { useEffect, useState, type CSSProperties } from 'react';
import { GameBoard } from '../game/components/GameBoard';
import { EquationControls } from '../game/components/EquationControls';
import { TacticalButton } from '../game/components/TacticalButton';
import { sprites } from '../assets/assetMap';
import { useVersusMatch } from '../game/versus/useVersusMatch';
import { versusShotGeometry } from '../game/versus/field';
import type { NumberFormat } from '../game/logic/rational';
import { readNumberFormat, writeNumberFormat } from '../game/logic/numberFormatStorage';
import {
  DEFAULT_KEYBINDINGS,
  findActionForKey,
  normalizeKey,
  type KeyBindings,
} from '../game/controls/keybindings';
import type { AttackVisual, MatchRole } from '../game/versus/types';

const MAX_BOARD = 620;

function boardSizeForViewport(width: number, height: number): number {
  if (width <= 700) return Math.max(280, Math.min(420, width - 40));

  const horizontalGutter = Math.min(96, Math.max(40, width * 0.06));
  return Math.max(280, Math.floor(Math.min(MAX_BOARD, (width - horizontalGutter) / 2, height - 310)));
}

function useVersusBoardSize(): number {
  const [size, setSize] = useState(() =>
    boardSizeForViewport(window.innerWidth, window.innerHeight),
  );

  useEffect(() => {
    const updateSize = () => {
      setSize(boardSizeForViewport(window.innerWidth, window.innerHeight));
    };
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

interface VersusMatchScreenProps {
  matchId: string;
  seed: number;
  role: MatchRole;
  opponentStudentId: string | null;
  myName: string;
  keyBindings?: KeyBindings;
  keyboardEnabled?: boolean;
  onExit: () => void;
}

function Hearts({ value, max }: { value: number; max: number }) {
  return (
    <div className="versus__hearts" aria-label={`${value} of ${max} hearts`}>
      {Array.from({ length: max }).map((_, i) => (
        <img key={i} src={i < value ? sprites.heartFull : sprites.heartEmpty} alt="" draggable={false} />
      ))}
    </div>
  );
}

function attackLabel(visual: AttackVisual): string {
  return visual.event.effect === 'freeze' ? 'FREEZE' : '+2 ASTEROIDS';
}

/** The live 1v1 duel: my interactive board + a read-only mirror of my rival. */
export function VersusMatchScreen({
  matchId,
  seed,
  role,
  opponentStudentId,
  myName,
  keyBindings = DEFAULT_KEYBINDINGS,
  keyboardEnabled = true,
  onExit,
}: VersusMatchScreenProps) {
  const boardSize = useVersusBoardSize();
  const match = useVersusMatch(matchId, seed, role, myName, opponentStudentId);
  const [notation, setNotation] = useState<NumberFormat>(readNumberFormat);
  const handleChangeNotation = (value: NumberFormat) => {
    setNotation(value);
    writeNumberFormat(value);
  };
  const {
    myLevel,
    mirrorLevel,
    m,
    b,
    xOffset,
    facing,
    shipX,
    myFireM,
    myFireB,
    destroyed,
    items,
    shot,
    explosions,
    hearts,
    myTotal,
    myCleared,
    frozen,
    attackVisuals,
    opponent,
    oppShotSeg,
    oppName,
    connected,
    result,
    setM,
    setB,
    setXOffset,
    setFacing,
    fire,
    onExplosionDone,
  } = match;

  const locked = frozen || !!result || !!shot;

  // Match Campaign and Arcade keyboard behavior, including user remaps.
  useEffect(() => {
    if (!keyboardEnabled) return;
    const round = (value: number) => Math.round(value * 100) / 100;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (locked) return;
      const action = findActionForKey(keyBindings, normalizeKey(e));
      if (!action) return;
      switch (action) {
        case 'fire':
          fire();
          break;
        case 'slopeUp':
          setM(round(m + 0.5));
          break;
        case 'slopeDown':
          setM(round(m - 0.5));
          break;
        case 'yInterceptUp':
          setB(round(b + 0.5));
          break;
        case 'yInterceptDown':
          setB(round(b - 0.5));
          break;
        case 'xOffsetUp':
          setXOffset(round(xOffset + 1));
          break;
        case 'xOffsetDown':
          setXOffset(round(xOffset - 1));
          break;
        case 'faceLeft':
          setFacing('left');
          break;
        case 'faceRight':
          setFacing('right');
          break;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    keyboardEnabled,
    keyBindings,
    fire,
    locked,
    m,
    b,
    xOffset,
    setM,
    setB,
    setXOffset,
    setFacing,
  ]);

  const opponentGeometry = opponent
    ? versusShotGeometry(opponent.m, opponent.b, opponent.xOffset ?? 0, opponent.facing)
    : { shipX: 0, fireM: 0, fireB: 0 };
  const oppDestroyed = new Set(opponent?.destroyedIds ?? []);
  const outgoing = [...attackVisuals].reverse().find((visual) => visual.direction === 'outgoing');
  const incoming = [...attackVisuals].reverse().find((visual) => visual.direction === 'incoming');
  const traveling = [...attackVisuals].reverse().find((visual) => visual.phase === 'travel');
  const announced = incoming ?? outgoing;
  const myBoardImpacted = incoming?.phase === 'impact';
  const opponentBoardImpacted =
    outgoing?.phase === 'impact' || outgoing?.phase === 'confirmed';

  return (
    <main
      className="versus"
      style={{ '--versus-board-size': `${boardSize}px` } as CSSProperties}
    >
      <header className="versus__bar">
        <TacticalButton asset="back" label="Leave match" size="small" onClick={onExit} />
        <span className="versus__title">
          {connected ? 'Duel live' : 'Connecting…'}
          {frozen && <strong className="versus__frozen"> · FROZEN</strong>}
        </span>
      </header>

      <div className="versus__arena">
        {traveling && (
          <div
            className={`versus__attack-flight versus__attack-flight--${traveling.direction} versus__attack-flight--${traveling.event.effect}`}
            aria-hidden="true"
          >
            <span>{traveling.event.effect === 'freeze' ? 'ICE' : '+2'}</span>
          </div>
        )}

        {/* My board */}
        <section
          className={`versus__side${frozen ? ' versus__side--frozen' : ''}${
            myBoardImpacted ? ' versus__side--attack-impact' : ''
          }`}
          aria-label="Your board"
        >
          <div className="versus__side-head">
            <span className="versus__name">{myName || 'You'}</span>
            <Hearts value={hearts} max={myLevel.hearts ?? 5} />
            <span className="versus__count">
              {myCleared}/{myTotal}
            </span>
          </div>
          <GameBoard
            width={boardSize}
            height={boardSize}
            level={myLevel}
            m={myFireM}
            b={myFireB}
            shipX={shipX}
            destroyed={destroyed}
            shot={shot}
            explosions={explosions}
            onExplosionDone={onExplosionDone}
            trajectoryPreview={myLevel.trajectoryPreview}
            facing={facing}
            bidirectional
            items={items}
          />
          {incoming && (
            <div
              className={`versus__attack-banner versus__attack-banner--incoming versus__attack-banner--${incoming.event.effect}`}
            >
              <strong>
                {incoming.phase === 'travel'
                  ? `INCOMING ${attackLabel(incoming)}`
                  : incoming.event.effect === 'freeze'
                    ? 'SCREEN FROZEN'
                    : '+2 ASTEROIDS ADDED'}
              </strong>
              <span>Sent by {incoming.event.sourceName}</span>
            </div>
          )}
          <EquationControls
            m={m}
            b={b}
            xOffset={xOffset}
            facing={facing}
            onChangeM={setM}
            onChangeB={setB}
            onChangeXOffset={setXOffset}
            onChangeFacing={setFacing}
            onFire={fire}
            onReset={() => {}}
            disabled={locked}
            won={!!result}
            controls={myLevel.allowedControls}
            equationForm={myLevel.equationForm}
            keyBindings={keyBindings}
            notation={notation}
            onChangeNotation={handleChangeNotation}
          />
        </section>

        {/* Opponent mirror */}
        <section
          className={`versus__side versus__side--mirror${
            opponentBoardImpacted ? ' versus__side--attack-impact' : ''
          }`}
          aria-label="Opponent board"
        >
          <div className="versus__side-head">
            <span className="versus__name">{oppName || 'Rival'}</span>
            <Hearts value={opponent?.hearts ?? 5} max={mirrorLevel.hearts ?? 5} />
            <span className="versus__count">
              {opponent ? `${opponent.cleared}/${opponent.total}` : '—'}
            </span>
          </div>
          <GameBoard
            width={boardSize}
            height={boardSize}
            level={mirrorLevel}
            m={opponentGeometry.fireM}
            b={opponentGeometry.fireB}
            shipX={opponentGeometry.shipX}
            destroyed={oppDestroyed}
            shot={oppShotSeg ? { start: oppShotSeg.start, end: oppShotSeg.end, progress: 1 } : null}
            explosions={[]}
            onExplosionDone={() => {}}
            trajectoryPreview={mirrorLevel.trajectoryPreview}
            facing={opponent?.facing ?? 'right'}
            bidirectional
            items={opponent?.items ?? []}
          />
          {outgoing && (
            <div
              className={`versus__attack-banner versus__attack-banner--outgoing versus__attack-banner--${outgoing.event.effect}`}
            >
              <strong>
                {outgoing.phase === 'travel'
                  ? `${attackLabel(outgoing)} LAUNCHED`
                  : outgoing.phase === 'confirmed'
                    ? outgoing.event.effect === 'freeze'
                      ? 'OPPONENT FROZEN'
                      : '+2 ASTEROIDS LANDED'
                    : `${attackLabel(outgoing)} IMPACT`}
              </strong>
              <span>
                {outgoing.phase === 'confirmed'
                  ? 'Opponent confirmed the effect'
                  : `Sending to ${oppName || 'your rival'}`}
              </span>
            </div>
          )}
          <p className="versus__mirror-note">Live view — shoot the +2 / ❄ pickups to attack.</p>
        </section>
      </div>

      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announced
          ? announced.direction === 'incoming'
            ? `${attackLabel(announced)} from ${announced.event.sourceName}. ${
                announced.phase === 'impact' ? 'The effect was applied.' : 'Incoming.'
              }`
            : `${attackLabel(announced)} ${
                announced.phase === 'confirmed'
                  ? 'was applied to your opponent.'
                  : 'was sent to your opponent.'
              }`
          : ''}
      </div>

      {result && (
        <div className="versus__result" role="alertdialog" aria-label="Match result">
          <div className="versus__result-card">
            <h2>{result === 'won' ? 'Victory!' : 'Defeated'}</h2>
            <p>
              {result === 'won'
                ? `You cleared your field before ${oppName || 'your rival'}.`
                : `${oppName || 'Your rival'} cleared first. Rematch?`}
            </p>
            <TacticalButton asset="confirm" label="Back to lobby" text="Back to lobby" onClick={onExit} />
          </div>
        </div>
      )}
    </main>
  );
}
