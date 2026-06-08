import type { StarCount } from '../campaign/stars';
import { StarRating } from './StarRating';

interface VictoryOverlayProps {
  shotsFired: number;
  score: number;
  stars: StarCount;
  hasNext: boolean;
  onAdvance: () => void;
  onReplay: () => void;
}

export function VictoryOverlay({
  shotsFired,
  score,
  stars,
  hasNext,
  onAdvance,
  onReplay,
}: VictoryOverlayProps) {
  return (
    <div className="game-overlay" role="dialog" aria-label="Victory">
      <div className="game-overlay__panel game-overlay__panel--win">
        <strong>Victory</strong>
        <p className="game-overlay__stats">
          Cleared in {shotsFired} shot{shotsFired === 1 ? '' : 's'} · Score {score}
        </p>
        <StarRating stars={stars} label="Mission stars" className="game-overlay__stars" size="large" />
        <div className="game-overlay__actions">
          <button type="button" className="btn btn--fire" onClick={onAdvance}>
            {hasNext ? '▶ Next Level' : '✓ Continue'}
          </button>
          <button type="button" className="btn btn--reset" onClick={onReplay}>
            ↺ Replay
          </button>
        </div>
      </div>
    </div>
  );
}
