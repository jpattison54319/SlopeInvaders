import type { Zone } from '../game/campaign/types';
import { ReflectionQuestionCard } from '../game/components/ReflectionQuestionCard';
import { ScreenChrome } from './ScreenChrome';

interface DebriefScreenProps {
  zone: Zone;
  onBack: () => void;
  onOpenSettings: () => void;
}

/**
 * End-of-zone reflection, shown once after the mastery check: multiple-choice
 * questions (with feedback) followed by open-ended "Mission Debrief" prompts.
 */
export function DebriefScreen({ zone, onBack, onOpenSettings }: DebriefScreenProps) {
  const reflections = zone.reflections ?? [];
  const debrief = zone.debrief;

  return (
    <ScreenChrome onBack={onBack} backLabel="Campaign" onOpenSettings={onOpenSettings}>
      <section className="debrief" aria-labelledby="debrief-title">
        <span className="menu__panel-label">Zone {zone.number} Complete</span>
        <h2 id="debrief-title">{debrief?.title ?? 'Mission Debrief'}</h2>
        <p className="debrief__intro">Great work clearing {zone.name}! Let&rsquo;s reflect.</p>

        {reflections.length > 0 && (
          <div className="debrief__quiz">
            {reflections.map((question, i) => (
              <ReflectionQuestionCard key={question.prompt} question={question} number={i + 1} />
            ))}
          </div>
        )}

        {debrief && debrief.prompts.length > 0 && (
          <>
            <h3 className="debrief__subhead">Think it over</h3>
            <ol className="debrief__list">
              {debrief.prompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ol>
          </>
        )}

        <button type="button" className="btn btn--fire debrief__continue" onClick={onBack}>
          ▶ Back to Campaign
        </button>
      </section>
    </ScreenChrome>
  );
}
