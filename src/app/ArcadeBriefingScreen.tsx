import type { ArcadeRecords } from '../game/arcade/types';
import { CoachPanel } from '../game/components/CoachPanel';
import { TacticalButton } from '../game/components/TacticalButton';
import { TacticalPanel, TacticalStatusRail } from '../game/components/TacticalPanel';
import { ScreenChrome } from './ScreenChrome';

interface ArcadeBriefingScreenProps {
  records: ArcadeRecords;
  onStart: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ArcadeBriefingScreen({
  records,
  onStart,
  onBack,
  onOpenSettings,
}: ArcadeBriefingScreenProps) {
  return (
    <ScreenChrome onBack={onBack} backLabel="Modes" onOpenSettings={onOpenSettings}>
      <section className="arcade-briefing" aria-labelledby="arcade-briefing-title">
        <header className="arcade-briefing__header">
          <span className="menu__panel-label">Endless Equation Defense</span>
          <h1 id="arcade-briefing-title">Arcade Run</h1>
          <p>
            Intercept falling asteroids with <strong>y = mx + b</strong>. They pause at
            grid vertices, then descend again. Three breaches end the run.
          </p>
        </header>

        <div className="arcade-briefing__grid">
          <TacticalPanel className="arcade-briefing__rules" tone="gold">
            <h2>Flight Plan</h2>
            <ol>
              <li>Read each visible coordinate and build a line through its core.</li>
              <li>Fire while it is parked, or earn a bonus by intercepting it mid-fall.</li>
              <li>Keep landing hits to raise your score multiplier.</li>
              <li>Each wave shortens the pause, but never below 2.75 seconds.</li>
            </ol>
            <p className="arcade-briefing__controls">
              Use the on-screen controls or your saved keyboard bindings. Change keyboard
              controls from Settings.
            </p>
          </TacticalPanel>

          <div className="arcade-briefing__side">
            <CoachPanel title="Mission Control">
              <strong>Accuracy before speed.</strong>
              <p>
                The timer creates urgency, but the coordinate and equation remain the fastest
                route to a reliable shot.
              </p>
            </CoachPanel>
            <TacticalStatusRail
              label="Arcade personal records"
              items={[
                { label: 'High Score', value: records.highScore },
                { label: 'Best Wave', value: records.bestWave || '—' },
                { label: 'Best Streak', value: records.longestStreak || '—' },
              ]}
            />
          </div>
        </div>

        <TacticalButton
          asset="play"
          label="Start Arcade Run"
          text="Start Run"
          size="large"
          className="arcade-briefing__start"
          onClick={onStart}
        />
      </section>
    </ScreenChrome>
  );
}
