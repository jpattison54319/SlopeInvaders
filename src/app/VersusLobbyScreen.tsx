import { useEffect, useState } from 'react';
import { ScreenChrome } from './ScreenChrome';
import { CoachPanel } from '../game/components/CoachPanel';
import { TacticalButton } from '../game/components/TacticalButton';
import { TacticalPanel } from '../game/components/TacticalPanel';
import { isCloudEnabled } from '../cloud/supabaseClient';
import { getCadetName, getJoinedClassroom } from '../cloud/identity';
import {
  cancelMatch,
  createMatch,
  getMatch,
  joinMatch,
  listOpenMatches,
  type MatchRow,
  type OpenMatch,
} from '../cloud/versus';
import type { MatchRole } from '../game/versus/types';

export interface StartMatchParams {
  matchId: string;
  seed: number;
  role: MatchRole;
  opponentStudentId: string | null;
}

interface VersusLobbyScreenProps {
  onStartMatch: (params: StartMatchParams) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenClassroom: () => void;
}

/**
 * Versus matchmaking: create an invite or join a classmate's open match. Only
 * students in the same class can see/join each other (enforced by the RPCs).
 */
export function VersusLobbyScreen({
  onStartMatch,
  onBack,
  onOpenSettings,
  onOpenClassroom,
}: VersusLobbyScreenProps) {
  const cloudOn = isCloudEnabled();
  const joined = getJoinedClassroom();
  const cadet = getCadetName();
  const ready = cloudOn && !!joined && !!cadet;

  const [open, setOpen] = useState<OpenMatch[]>([]);
  const [hosted, setHosted] = useState<MatchRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Poll the open-match list while idle.
  useEffect(() => {
    if (!ready || hosted) return;
    let active = true;
    const tick = () => listOpenMatches().then((list) => active && setOpen(list));
    tick();
    const id = window.setInterval(tick, 3000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [ready, hosted]);

  // While hosting, poll for a guest to arrive.
  useEffect(() => {
    if (!hosted) return;
    let active = true;
    const id = window.setInterval(async () => {
      const row = await getMatch(hosted.id);
      if (!active || !row) return;
      if (row.status === 'full' && row.guest_student_id) {
        active = false;
        window.clearInterval(id);
        onStartMatch({
          matchId: row.id,
          seed: row.level_seed,
          role: 'host',
          opponentStudentId: row.guest_student_id,
        });
      } else if (row.status === 'cancelled') {
        active = false;
        window.clearInterval(id);
        setHosted(null);
      }
    }, 2000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [hosted, onStartMatch]);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      setHosted(await createMatch());
    } catch {
      setError('Could not create a match. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (hosted) await cancelMatch(hosted.id);
    setHosted(null);
  };

  const handleJoin = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const row = await joinMatch(id);
      onStartMatch({
        matchId: row.id,
        seed: row.level_seed,
        role: 'guest',
        opponentStudentId: row.host_student_id,
      });
    } catch {
      setError('That match was already taken. Pick another.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenChrome onBack={onBack} backLabel="Menu" onOpenSettings={onOpenSettings}>
      <section className="classroom" aria-labelledby="versus-title">
        <header className="classroom__head">
          <span className="menu__panel-label">Head to Head</span>
          <h2 id="versus-title">Versus Duel</h2>
        </header>

        {!ready ? (
          <CoachPanel className="classroom__notice">
            <strong>Join a class to duel.</strong>
            <span>
              {cloudOn
                ? 'Versus matches are limited to students in the same class. Join your class and name a cadet first.'
                : 'Versus needs the classroom cloud configured (see DEPLOYMENT.md).'}
            </span>
            {cloudOn && (
              <TacticalButton
                asset="hangar"
                label="Open classroom"
                text="Go to Classroom"
                size="small"
                onClick={onOpenClassroom}
              />
            )}
          </CoachPanel>
        ) : hosted ? (
          <TacticalPanel className="classroom__joined" tone="gold">
            <span className="menu__panel-label">Waiting for an opponent…</span>
            <h3>{joined?.name}</h3>
            <p className="classroom__code-line">
              Tell a classmate to open Versus and join <strong>your</strong> match.
            </p>
            <div className="classroom__actions">
              <TacticalButton asset="back" label="Cancel match" text="Cancel" size="small" onClick={handleCancel} />
            </div>
          </TacticalPanel>
        ) : (
          <>
            <TacticalPanel className="classroom__form">
              <p className="versus__lobby-intro">
                Race a classmate to clear your asteroids. Shoot <strong>+2</strong> and{' '}
                <strong>❄</strong> pickups to attack their board.
              </p>
              <div className="classroom__actions">
                <TacticalButton
                  asset="play"
                  label="Create match"
                  text={busy ? 'Working…' : 'Create match'}
                  onClick={handleCreate}
                  disabled={busy}
                />
              </div>
              {error && (
                <p className="classroom__error" role="alert">
                  {error}
                </p>
              )}
            </TacticalPanel>

            <section className="profile__section" aria-label="Open matches">
              <header className="profile__section-head">
                <h3>Open matches in {joined?.name}</h3>
                <span className="profile__section-meta">{open.length} waiting</span>
              </header>
              {open.length === 0 ? (
                <p className="teacher__status">No open matches yet — create one above.</p>
              ) : (
                <ul className="teacher__class-list">
                  {open.map((mtch) => (
                    <li key={mtch.id}>
                      <button type="button" onClick={() => handleJoin(mtch.id)} disabled={busy}>
                        <strong>{mtch.host_name || 'A cadet'}</strong>
                        <span>Join</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </section>
    </ScreenChrome>
  );
}
