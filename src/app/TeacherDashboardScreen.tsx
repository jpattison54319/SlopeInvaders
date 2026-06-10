import { useEffect, useState } from 'react';
import { ScreenChrome } from './ScreenChrome';
import { CoachPanel } from '../game/components/CoachPanel';
import { TacticalButton } from '../game/components/TacticalButton';
import { TacticalPanel } from '../game/components/TacticalPanel';
import { isCloudEnabled } from '../cloud/supabaseClient';
import { createClassroom, getDashboard, type DashboardData } from '../cloud/classroom';
import { addTeacherClass, getTeacherClasses, type TeacherClass } from '../cloud/identity';

interface TeacherDashboardScreenProps {
  /** Teacher key from a `?teacher=` deep link. */
  initialTeacherKey?: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

function teacherLink(teacherKey: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?teacher=${teacherKey}`;
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * The teacher's class dashboard. There is no teacher account: creating a class
 * mints an unguessable teacher key, and possession of it (via the saved secret
 * link, or this device's remembered list) is what grants dashboard access.
 */
export function TeacherDashboardScreen({
  initialTeacherKey,
  onBack,
  onOpenSettings,
}: TeacherDashboardScreenProps) {
  const cloudOn = isCloudEnabled();
  const [activeKey, setActiveKey] = useState<string | null>(initialTeacherKey ?? null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState('');
  const [busy, setBusy] = useState(false);
  const [openStudent, setOpenStudent] = useState<string | null>(null);
  const [saved, setSaved] = useState<TeacherClass[]>(() => getTeacherClasses());

  // Loading is derived (no extra state set inside the effect): we're fetching
  // whenever a class is selected but neither its data nor an error is in yet.
  const loading = cloudOn && !!activeKey && !data && !error;

  // Fetch the dashboard when the active class changes. The effect only mutates
  // state from the resolved/rejected promise — never synchronously.
  useEffect(() => {
    if (!cloudOn || !activeKey) return;
    let cancelled = false;
    getDashboard(activeKey)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this class. The teacher link may be invalid.');
      });
    return () => {
      cancelled = true;
    };
  }, [cloudOn, activeKey]);

  /** Switch the viewed class, clearing any stale data/error first. */
  const openClass = (teacherKey: string | null) => {
    setData(null);
    setError(null);
    setOpenStudent(null);
    setActiveKey(teacherKey);
  };

  const handleCreate = async () => {
    const name = className.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createClassroom(name);
      const record: TeacherClass = {
        classroomId: created.classroomId,
        name: created.name,
        joinCode: created.joinCode,
        teacherKey: created.teacherKey,
      };
      addTeacherClass(record);
      setSaved(getTeacherClasses());
      setClassName('');
      openClass(created.teacherKey);
    } catch {
      setError('Could not create the class. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const activeSaved = saved.find((c) => c.teacherKey === activeKey);

  return (
    <ScreenChrome onBack={onBack} backLabel="Back" onOpenSettings={onOpenSettings}>
      <section className="teacher" aria-labelledby="teacher-title">
        <header className="classroom__head">
          <span className="menu__panel-label">Mission Control</span>
          <h2 id="teacher-title">Teacher Dashboard</h2>
        </header>

        {!cloudOn && (
          <CoachPanel className="classroom__notice">
            <strong>Classroom cloud isn&rsquo;t configured yet.</strong>
            <span>
              Set the Supabase env vars and run the migration (see DEPLOYMENT.md) to
              create classes and track student progress.
            </span>
          </CoachPanel>
        )}

        {cloudOn && !activeKey && (
          <>
            <TacticalPanel className="classroom__form">
              <label className="classroom__field">
                <span>New class name</span>
                <input
                  value={className}
                  maxLength={40}
                  placeholder="e.g. Period 3 Algebra"
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={busy}
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
                  label="Create class"
                  text={busy ? 'Creating…' : 'Create class'}
                  onClick={handleCreate}
                  disabled={busy}
                />
              </div>
            </TacticalPanel>

            {saved.length > 0 && (
              <section className="profile__section" aria-label="Your classes">
                <header className="profile__section-head">
                  <h3>Your classes</h3>
                  <span className="profile__section-meta">Saved on this device.</span>
                </header>
                <ul className="teacher__class-list">
                  {saved.map((c) => (
                    <li key={c.classroomId}>
                      <button type="button" onClick={() => openClass(c.teacherKey)}>
                        <strong>{c.name}</strong>
                        <span>Code {c.joinCode}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {cloudOn && activeKey && (
          <>
            {(activeSaved || data) && (
              <TacticalPanel className="teacher__share" tone="gold">
                <span className="menu__panel-label">Share with students</span>
                <h3>{data?.classroom.name ?? activeSaved?.name}</h3>
                <p className="classroom__code-line">
                  Class code{' '}
                  <strong>{data?.classroom.joinCode ?? activeSaved?.joinCode}</strong>
                </p>
                <label className="classroom__field">
                  <span>Your private dashboard link (bookmark it — no password)</span>
                  <input readOnly value={teacherLink(activeKey)} onFocus={(e) => e.target.select()} />
                </label>
                <div className="classroom__actions">
                  <TacticalButton
                    asset="list"
                    label="Switch class"
                    text="Switch class"
                    size="small"
                    onClick={() => openClass(null)}
                  />
                </div>
              </TacticalPanel>
            )}

            {loading && <p className="teacher__status">Loading class…</p>}
            {error && (
              <p className="classroom__error" role="alert">
                {error}
              </p>
            )}

            {data && data.students.length === 0 && (
              <CoachPanel className="classroom__notice">
                <strong>No students yet.</strong>
                <span>Share the class code above so cadets can join.</span>
              </CoachPanel>
            )}

            {data && data.students.length > 0 && (
              <div className="teacher__roster" role="table" aria-label="Class roster">
                <div className="teacher__roster-head" role="row">
                  <span role="columnheader">Cadet</span>
                  <span role="columnheader">Last active</span>
                  <span role="columnheader">Levels</span>
                  <span role="columnheader">Stars</span>
                  <span role="columnheader">XP / Rank</span>
                  <span role="columnheader">Accuracy</span>
                </div>
                {data.students.map((s) => {
                  const accuracy =
                    s.totalShots > 0 ? Math.round((s.totalHits / s.totalShots) * 100) : 100;
                  const isOpen = openStudent === s.studentId;
                  const results = data.levelResults
                    .filter((r) => r.studentId === s.studentId)
                    .sort((a, b) => a.levelId.localeCompare(b.levelId));
                  return (
                    <div key={s.studentId} className="teacher__roster-group">
                      <button
                        type="button"
                        className="teacher__roster-row"
                        role="row"
                        aria-expanded={isOpen}
                        onClick={() => setOpenStudent(isOpen ? null : s.studentId)}
                      >
                        <span role="cell" className="teacher__cadet">
                          {s.cadetName || 'Unnamed cadet'}
                        </span>
                        <span role="cell">{formatWhen(s.lastSeen)}</span>
                        <span role="cell">{s.levelsCompleted}</span>
                        <span role="cell">{s.totalStars} ★</span>
                        <span role="cell">
                          {s.totalXp} · {s.rank}
                        </span>
                        <span role="cell">{accuracy}%</span>
                      </button>
                      {isOpen && (
                        <ul className="teacher__detail">
                          {results.length === 0 && <li>No per-level detail yet.</li>}
                          {results.map((r) => (
                            <li key={r.levelId}>
                              <span className="teacher__detail-level">{r.levelId}</span>
                              <span>{r.stars} ★</span>
                              <span>{Math.round(r.accuracy * 100)}% acc</span>
                              <span>{r.attempts} {r.attempts === 1 ? 'try' : 'tries'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </ScreenChrome>
  );
}
