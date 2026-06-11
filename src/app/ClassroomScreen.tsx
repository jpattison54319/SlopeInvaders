import { useState } from 'react';
import { ScreenChrome } from './ScreenChrome';
import { CoachPanel } from '../game/components/CoachPanel';
import { TacticalButton } from '../game/components/TacticalButton';
import { TacticalPanel } from '../game/components/TacticalPanel';
import { isCloudEnabled } from '../cloud/supabaseClient';
import { joinClassroom } from '../cloud/classroom';
import {
  clearJoinedClassroom,
  getCadetName,
  getJoinedClassroom,
  setCadetName,
  setJoinedClassroom,
  type JoinedClassroom,
} from '../cloud/identity';
import type { CampaignProgress } from './useCampaignProgress';

interface ClassroomScreenProps {
  progress: CampaignProgress;
  /** Prefilled join code from a `?class=` deep link. */
  initialJoinCode?: string;
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenTeacher: () => void;
}

/**
 * Account-free classroom join. A student picks a cadet name and enters the
 * teacher's class code; on success we record the class locally and backfill the
 * learner's existing solo progress to the cloud. No login, no password.
 */
export function ClassroomScreen({
  progress,
  initialJoinCode,
  onBack,
  onOpenSettings,
  onOpenTeacher,
}: ClassroomScreenProps) {
  const cloudOn = isCloudEnabled();
  const [joined, setJoined] = useState<JoinedClassroom | null>(() => getJoinedClassroom());
  const [cadet, setCadet] = useState(() => getCadetName());
  const [code, setCode] = useState(initialJoinCode ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setError(null);
    const name = cadet.trim();
    if (!name) {
      setError('Enter a cadet name first.');
      return;
    }
    if (!code.trim()) {
      setError('Enter the class code from your teacher.');
      return;
    }
    setBusy(true);
    try {
      setCadetName(name);
      const info = await joinClassroom(code, name);
      const record: JoinedClassroom = {
        classroomId: info.classroomId,
        joinCode: info.joinCode,
        name: info.name,
      };
      setJoinedClassroom(record);
      setJoined(record);
      // Backfill any solo progress this cadet already has.
      progress.syncNow();
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('not configured')
          ? 'Classroom cloud is not set up yet.'
          : 'That class code was not found. Check it with your teacher.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = () => {
    clearJoinedClassroom();
    setJoined(null);
  };

  const handleNameSave = () => {
    setCadetName(cadet.trim());
    // Re-sync so the dashboard shows the new name.
    progress.syncNow();
  };

  return (
    <ScreenChrome onBack={onBack} backLabel="Menu" onOpenSettings={onOpenSettings}>
      <section className="classroom" aria-labelledby="classroom-title">
        <header className="classroom__head">
          <span className="menu__panel-label">Squadron</span>
          <h2 id="classroom-title">Classroom</h2>
        </header>

        {!cloudOn && (
          <CoachPanel className="classroom__notice">
            <strong>Classroom cloud isn&rsquo;t configured yet.</strong>
            <span>
              A teacher needs to set up the Supabase project (see DEPLOYMENT.md). You can
              still play the whole campaign solo — your progress saves on this device.
            </span>
          </CoachPanel>
        )}

        {joined ? (
          <TacticalPanel className="classroom__joined" tone="success">
            <span className="menu__panel-label">You&rsquo;re in</span>
            <h3>{joined.name}</h3>
            <p className="classroom__code-line">
              Class code <strong>{joined.joinCode}</strong>
            </p>
            <label className="classroom__field">
              <span>Cadet name</span>
              <input
                value={cadet}
                maxLength={24}
                onChange={(e) => setCadet(e.target.value)}
                onBlur={handleNameSave}
                disabled={!cloudOn}
              />
            </label>
            <div className="classroom__actions">
              <TacticalButton
                asset="back"
                label="Leave class"
                text="Leave class"
                size="small"
                onClick={handleLeave}
              />
            </div>
          </TacticalPanel>
        ) : (
          <TacticalPanel className="classroom__form">
            <label className="classroom__field">
              <span>Cadet name</span>
              <input
                value={cadet}
                maxLength={24}
                placeholder="e.g. Nova"
                onChange={(e) => setCadet(e.target.value)}
                disabled={!cloudOn || busy}
              />
            </label>
            <label className="classroom__field">
              <span>Class code</span>
              <input
                value={code}
                maxLength={8}
                placeholder="ABC123"
                autoCapitalize="characters"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={!cloudOn || busy}
              />
            </label>
            {error && (
              <p className="classroom__error" role="alert">
                {error}
              </p>
            )}
            <div className="classroom__actions">
              <TacticalButton
                asset="confirm"
                label="Join class"
                text={busy ? 'Joining…' : 'Join class'}
                onClick={handleJoin}
                disabled={!cloudOn || busy}
              />
            </div>
          </TacticalPanel>
        )}

        <CoachPanel compact className="classroom__teacher-link">
          <strong>Are you a teacher?</strong>{' '}
          <span>Create a class and get a dashboard of your students&rsquo; progress.</span>
          <TacticalButton
            asset="trophy"
            label="Open teacher area"
            text="Teacher area"
            size="small"
            style={{ marginTop: '0.5em' }}
            onClick={onOpenTeacher}
          />
        </CoachPanel>
      </section>
    </ScreenChrome>
  );
}
