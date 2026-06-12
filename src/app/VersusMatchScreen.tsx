import { useEffect } from 'react';
import { GameBoard } from '../game/components/GameBoard';
import { EquationControls } from '../game/components/EquationControls';
import { TacticalButton } from '../game/components/TacticalButton';
import { sprites } from '../assets/assetMap';
import { useVersusMatch } from '../game/versus/useVersusMatch';
import type { MatchRole } from '../game/versus/types';

const BOARD = 400;

interface VersusMatchScreenProps {
  matchId: string;
  seed: number;
  role: MatchRole;
  opponentStudentId: string | null;
  myName: string;
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

/** The live 1v1 duel: my interactive board + a read-only mirror of my rival. */
export function VersusMatchScreen({
  matchId,
  seed,
  role,
  opponentStudentId,
  myName,
  onExit,
}: VersusMatchScreenProps) {
  const match = useVersusMatch(matchId, seed, role, myName, opponentStudentId);
  const {
    myLevel,
    mirrorLevel,
    m,
    b,
    facing,
    myFireM,
    destroyed,
    items,
    shot,
    explosions,
    hearts,
    myTotal,
    myCleared,
    frozen,
    opponent,
    oppShotSeg,
    oppName,
    connected,
    result,
    setM,
    setB,
    setFacing,
    fire,
    onExplosionDone,
  } = match;

  const locked = frozen || !!result || !!shot;

  // Minimal keyboard: Space fires, W/S nudge b, R/F nudge slope, Q/E face.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (key === ' ') {
        e.preventDefault();
        fire();
      } else if (locked) {
        return;
      } else if (key === 'w') setB(b + 1);
      else if (key === 's') setB(b - 1);
      else if (key === 'r') setM(m + 1);
      else if (key === 'f') setM(m - 1);
      else if (key === 'q') setFacing('left');
      else if (key === 'e') setFacing('right');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fire, locked, m, b, setM, setB, setFacing]);

  const oppFireM = opponent ? (opponent.facing === 'right' ? opponent.m : -opponent.m) : 0;
  const oppDestroyed = new Set(opponent?.destroyedIds ?? []);

  return (
    <main className="versus">
      <header className="versus__bar">
        <TacticalButton asset="back" label="Leave match" size="small" onClick={onExit} />
        <span className="versus__title">
          {connected ? 'Duel live' : 'Connecting…'}
          {frozen && <strong className="versus__frozen"> · FROZEN</strong>}
        </span>
      </header>

      <div className="versus__arena">
        {/* My board */}
        <section className="versus__side" aria-label="Your board">
          <div className="versus__side-head">
            <span className="versus__name">{myName || 'You'}</span>
            <Hearts value={hearts} max={myLevel.hearts ?? 5} />
            <span className="versus__count">
              {myCleared}/{myTotal}
            </span>
          </div>
          <GameBoard
            width={BOARD}
            height={BOARD}
            level={myLevel}
            m={myFireM}
            b={b}
            shipX={0}
            destroyed={destroyed}
            shot={shot}
            explosions={explosions}
            onExplosionDone={onExplosionDone}
            trajectoryPreview={myLevel.trajectoryPreview}
            facing={facing}
            bidirectional
            items={items}
          />
          <EquationControls
            m={m}
            b={b}
            xOffset={0}
            facing={facing}
            onChangeM={setM}
            onChangeB={setB}
            onChangeXOffset={() => {}}
            onChangeFacing={setFacing}
            onFire={fire}
            onReset={() => {}}
            disabled={locked}
            won={!!result}
            controls={myLevel.allowedControls}
            equationForm={myLevel.equationForm}
          />
        </section>

        {/* Opponent mirror */}
        <section className="versus__side versus__side--mirror" aria-label="Opponent board">
          <div className="versus__side-head">
            <span className="versus__name">{oppName || 'Rival'}</span>
            <Hearts value={opponent?.hearts ?? 5} max={mirrorLevel.hearts ?? 5} />
            <span className="versus__count">
              {opponent ? `${opponent.cleared}/${opponent.total}` : '—'}
            </span>
          </div>
          <GameBoard
            width={BOARD}
            height={BOARD}
            level={mirrorLevel}
            m={oppFireM}
            b={opponent?.b ?? 0}
            shipX={0}
            destroyed={oppDestroyed}
            shot={oppShotSeg ? { start: oppShotSeg.start, end: oppShotSeg.end, progress: 1 } : null}
            explosions={[]}
            onExplosionDone={() => {}}
            trajectoryPreview={mirrorLevel.trajectoryPreview}
            facing={opponent?.facing ?? 'right'}
            bidirectional
            items={opponent?.items ?? []}
          />
          <p className="versus__mirror-note">Live view — shoot the +2 / ❄ pickups to attack.</p>
        </section>
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
