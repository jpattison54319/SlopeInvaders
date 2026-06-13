import type { CSSProperties } from 'react';
import { sprites, uiHud } from '../../assets/assetMap';
import type { ShotFeedback } from '../logic/hints';
import { CoachPanel } from './CoachPanel';
import { TacticalStatusRail } from './TacticalPanel';

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
          style={{ '--health-rail': `url(${uiHud.healthRail})` } as CSSProperties}
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

      <div data-tour="stats">
        <TacticalStatusRail
          className="hud__stats"
          label="Mission statistics"
          items={[
            { label: 'Score', value: score },
            { label: 'Targets', value: `${destroyedCount}/${total}` },
            { label: 'Shots', value: shotsFired },
          ]}
        />
      </div>

      {won ? (
        <div className="feedback feedback--win" data-tour="hint" role="status">
          <CoachPanel title="Mission Control" tone="success" compact>
            <strong>Victory!</strong>
            <p>
              All asteroids cleared in {shotsFired} shot{shotsFired === 1 ? '' : 's'}. Final
              score: {score}.
            </p>
          </CoachPanel>
        </div>
      ) : feedback ? (
        <div
          className={`feedback ${feedback.hit ? 'feedback--hit' : 'feedback--miss'}`}
          data-tour="hint"
          role="status"
        >
          <CoachPanel title="Mission Control" tone={feedback.hit ? 'success' : 'warning'} compact>
            <strong>{feedback.headline}</strong>
            <p>{feedback.detail}</p>
          </CoachPanel>
        </div>
      ) : (
        <div className="feedback feedback--idle" data-tour="hint" role="status">
          <CoachPanel title="Mission Control" compact>
            <strong>Ready.</strong>
            <p>Set your equation, check the dashed trajectory, then Fire.</p>
          </CoachPanel>
        </div>
      )}
    </div>
  );
}
