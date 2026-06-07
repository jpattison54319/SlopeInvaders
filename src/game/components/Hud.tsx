import { sprites } from '../../assets/assetMap';
import type { ShotFeedback } from '../logic/hints';

interface HudProps {
  score: number;
  remaining: number;
  total: number;
  shotsFired: number;
  feedback: ShotFeedback | null;
  won: boolean;
  /** Current hearts; omit (with maxHearts) for no lives display. */
  hearts?: number;
  /** Total hearts; when finite, a hearts row is shown. */
  maxHearts?: number;
}

/** Score, progress, hearts, the learning goal, and the post-shot feedback panel. */
export function Hud({
  score,
  remaining,
  total,
  shotsFired,
  feedback,
  won,
  hearts,
  maxHearts,
}: HudProps) {
  const destroyedCount = total - remaining;
  const showHearts = typeof maxHearts === 'number' && Number.isFinite(maxHearts) && maxHearts > 0;
  const heartCount = typeof hearts === 'number' ? hearts : 0;

  return (
    <div className="hud">
      {showHearts && (
        <div
          className="hud__hearts"
          data-tour="hearts"
          role="img"
          aria-label={`${heartCount} of ${maxHearts} hearts remaining`}
        >
          {Array.from({ length: maxHearts }).map((_, i) => (
            <img
              key={i}
              className="hud__heart"
              src={i < heartCount ? sprites.heartFull : sprites.heartEmpty}
              alt=""
              draggable={false}
            />
          ))}
        </div>
      )}

      <div className="hud__stats" data-tour="stats">
        <div className="stat">
          <span className="stat__value">{score}</span>
          <span className="stat__label">Score</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {destroyedCount}/{total}
          </span>
          <span className="stat__label">Asteroids</span>
        </div>
        <div className="stat">
          <span className="stat__value">{shotsFired}</span>
          <span className="stat__label">Shots</span>
        </div>
      </div>

      {won ? (
        <div className="feedback feedback--win" data-tour="hint" role="status">
          <strong>Level Complete!</strong>
          <p>
            All asteroids cleared in {shotsFired} shot{shotsFired === 1 ? '' : 's'}. Final score:{' '}
            {score}.
          </p>
        </div>
      ) : feedback ? (
        <div
          className={`feedback ${feedback.hit ? 'feedback--hit' : 'feedback--miss'}`}
          data-tour="hint"
          role="status"
        >
          <strong>{feedback.headline}</strong>
          <p>{feedback.detail}</p>
        </div>
      ) : (
        <div className="feedback feedback--idle" data-tour="hint" role="status">
          <strong>Ready.</strong>
          <p>Set your slope and y-intercept, watch the dashed aiming line, then Fire!</p>
        </div>
      )}
    </div>
  );
}
