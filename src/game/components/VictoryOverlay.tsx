import type { CSSProperties } from 'react';
import type { StarCount } from '../campaign/stars';
import type { XpAward } from '../campaign/xp';
import type { BadgeDef } from '../campaign/badges';
import { uiCoach, uiResults } from '../../assets/assetMap';
import { StarRating } from './StarRating';
import { TacticalButton } from './TacticalButton';

interface VictoryOverlayProps {
  shotsFired: number;
  score: number;
  stars: StarCount;
  /** XP this completion earned (omitted when no progress store is wired). */
  xp?: XpAward;
  /** Badges first earned by this completion. */
  newBadges?: BadgeDef[];
  hasNext: boolean;
  onAdvance: () => void;
  onReplay: () => void;
}

export function VictoryOverlay({
  shotsFired,
  score,
  stars,
  xp,
  newBadges,
  hasNext,
  onAdvance,
  onReplay,
}: VictoryOverlayProps) {
  return (
    <div className="game-overlay" role="dialog" aria-label="Victory">
      <div
        className="game-overlay__panel game-overlay__panel--win game-overlay__panel--framed"
        style={{ '--result-frame': `url(${uiResults.victoryFrame})` } as CSSProperties}
      >
        <img className="game-overlay__coach" src={uiCoach.victoryControl} alt="" draggable={false} />
        <strong>Victory</strong>
        <p className="game-overlay__stats">
          Cleared in {shotsFired} shot{shotsFired === 1 ? '' : 's'} · Score {score}
        </p>
        <StarRating stars={stars} label="Mission stars" className="game-overlay__stars" size="large" />
        {xp && (
          <div className="game-overlay__xp" aria-label="XP earned">
            <ul className="xp-breakdown">
              {xp.bonuses.map((bonus) => (
                <li key={bonus.id} className="xp-row">
                  <span className="xp-row__text">
                    <span className="xp-row__label">{bonus.label}</span>
                    <span className="xp-row__reason">{bonus.reason}</span>
                  </span>
                  <span className="xp-row__points">+{bonus.points}</span>
                </li>
              ))}
            </ul>
            {xp.awardedXp > 0 ? (
              <p className="xp-banked">
                +{xp.awardedXp} XP banked · {xp.newTotalXp} total
              </p>
            ) : (
              <p className="xp-banked xp-banked--held">
                Best run already banked — beat it to earn more XP
              </p>
            )}
          </div>
        )}
        {newBadges && newBadges.length > 0 && (
          <div className="game-overlay__badges" aria-label="Badges earned">
            {newBadges.map((badge) => (
              <div key={badge.id} className="badge-chip">
                <span className="badge-chip__title">Badge earned!</span>
                <span className="badge-chip__name">{badge.name}</span>
                <span className="badge-chip__desc">{badge.description}</span>
              </div>
            ))}
          </div>
        )}
        <div className="game-overlay__actions">
          <TacticalButton
            asset="forward"
            label={hasNext ? 'Next Level' : 'Continue'}
            text={hasNext ? 'Next Level' : 'Continue'}
            size="large"
            onClick={onAdvance}
          />
          <TacticalButton asset="replay" label="Replay" text="Replay" size="large" onClick={onReplay} />
        </div>
      </div>
    </div>
  );
}
