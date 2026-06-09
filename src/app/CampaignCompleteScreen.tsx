import { useMemo } from 'react';
import { ScreenChrome } from './ScreenChrome';
import { Fireworks } from '../game/components/Fireworks';
import { orderedLevels } from '../game/campaign/zones';
import type { CampaignProgress } from './useCampaignProgress';

interface CampaignCompleteScreenProps {
  progress: CampaignProgress;
  reducedMotion: boolean;
  onMenu: () => void;
  onGalaxy: () => void;
  onOpenSettings: () => void;
}

/**
 * The campaign finale, shown after the final zone's debrief. Celebrates beating
 * all eight zones with an 8-bit firework overlay and a tally of stars earned.
 * "Replay Campaign" is non-destructive — progress is kept so any level can be
 * replayed for more stars.
 */
export function CampaignCompleteScreen({
  progress,
  reducedMotion,
  onMenu,
  onGalaxy,
  onOpenSettings,
}: CampaignCompleteScreenProps) {
  const { earnedStars, maxStars } = useMemo(() => {
    const earned = orderedLevels.reduce((sum, { level }) => sum + progress.getLevelStars(level.id), 0);
    return { earnedStars: earned, maxStars: orderedLevels.length * 3 };
  }, [progress]);

  const profile = progress.getProfileStats();
  const accuracy = profile.totalShots > 0 ? Math.round((profile.totalHits / profile.totalShots) * 100) : 100;

  return (
    <ScreenChrome onBack={onMenu} backLabel="Main Menu" onOpenSettings={onOpenSettings}>
      <Fireworks reducedMotion={reducedMotion} />
      <section className="debrief campaign-complete" aria-labelledby="campaign-complete-title">
        <span className="menu__panel-label">Campaign Complete</span>
        <h2 id="campaign-complete-title">You beat Slope Invaders!</h2>
        <p className="debrief__intro">
          All eight zones cleared, pilot. You mastered slope, intercepts, every quadrant, walls,
          chains, allies, and the moving cannon. The galaxy is safe.
        </p>

        <p className="campaign-complete__stars" aria-label={`${earnedStars} of ${maxStars} stars earned`}>
          ★ {earnedStars} / {maxStars}
        </p>

        <ul className="campaign-complete__stats">
          <li>
            <span>Levels cleared</span>
            <strong>{orderedLevels.length}</strong>
          </li>
          <li>
            <span>Lifetime accuracy</span>
            <strong>{accuracy}%</strong>
          </li>
          <li>
            <span>Shots fired</span>
            <strong>{profile.totalShots}</strong>
          </li>
        </ul>

        <div className="campaign-complete__actions">
          <button type="button" className="btn btn--fire" onClick={onGalaxy}>
            ★ Replay Campaign
          </button>
          <button type="button" className="btn btn--reset" onClick={onMenu}>
            ← Back to Menu
          </button>
        </div>
      </section>
    </ScreenChrome>
  );
}
