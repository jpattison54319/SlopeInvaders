import { useEffect, useState } from 'react';
import { ScreenChrome } from './ScreenChrome';
import { CoachPanel } from '../game/components/CoachPanel';
import { TacticalButton } from '../game/components/TacticalButton';
import { TacticalPanel } from '../game/components/TacticalPanel';
import { isCloudEnabled } from '../cloud/supabaseClient';
import { createClassroom, getDashboard, setClassGoal, type DashboardData } from '../cloud/classroom';
import type { ClassGoalKind } from '../cloud/classGoal';
import { orderedLevels } from '../game/campaign/zones';
import { addTeacherClass, getTeacherClasses, type TeacherClass } from '../cloud/identity';

type RosterSort = 'name' | 'stars' | 'accuracy' | 'levels' | 'xp';

// Campaign scale, for the teacher's goal reference. Each level awards up to 3
// stars, so a single cadet's full-completion ceiling is LEVELS and LEVELS × 3.
const TOTAL_LEVELS = orderedLevels.length;
const MAX_STARS_PER_CADET = TOTAL_LEVELS * 3;

const SORTS: { id: RosterSort; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'stars', label: 'Stars' },
  { id: 'accuracy', label: 'Accuracy' },
  { id: 'levels', label: 'Levels' },
  { id: 'xp', label: 'XP' },
];

function accuracyOf(s: { totalShots: number; totalHits: number }): number {
  return s.totalShots > 0 ? s.totalHits / s.totalShots : 1;
}

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
  const [sortBy, setSortBy] = useState<RosterSort>('name');
  const [goalKind, setGoalKind] = useState<ClassGoalKind>('stars');
  const [goalTarget, setGoalTarget] = useState('100');
  const [goalMsg, setGoalMsg] = useState<string | null>(null);

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

  const handleSaveGoal = async () => {
    if (!activeKey) return;
    setGoalMsg(null);
    try {
      await setClassGoal(activeKey, goalKind, Math.max(0, parseInt(goalTarget, 10) || 0));
      setGoalMsg('Squadron goal saved — cadets will see the shared progress bar.');
    } catch {
      setGoalMsg('Could not save the goal. Try again.');
    }
  };

  const handleClearGoal = async () => {
    if (!activeKey) return;
    setGoalMsg(null);
    try {
      await setClassGoal(activeKey, null, 0);
      setGoalMsg('Goal cleared.');
    } catch {
      setGoalMsg('Could not clear the goal. Try again.');
    }
  };

  const activeSaved = saved.find((c) => c.teacherKey === activeKey);

  // Teacher-only leaderboard sort (client-side over already-synced totals).
  // Never shown to students — the learner view stays comparison-free.
  const rosterStudents = data
    ? [...data.students].sort((a, b) => {
        switch (sortBy) {
          case 'stars':
            return b.totalStars - a.totalStars;
          case 'accuracy':
            return accuracyOf(b) - accuracyOf(a);
          case 'levels':
            return b.levelsCompleted - a.levelsCompleted;
          case 'xp':
            return b.totalXp - a.totalXp;
          default:
            return a.cadetName.localeCompare(b.cadetName);
        }
      })
    : [];

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

            {data && (
              <TacticalPanel className="teacher__goal">
                <span className="menu__panel-label">Squadron Goal (cooperative)</span>
                <p className="teacher__goal-blurb">
                  Set one shared goal the whole class works toward together. Cadets see the
                  combined class total — never a ranking against each other.
                </p>
                <p className="teacher__goal-ref">
                  <strong>Scale reference:</strong> the campaign has {TOTAL_LEVELS} levels, so each
                  cadet can earn up to {MAX_STARS_PER_CADET} stars (3★ per level).
                  {data.students.length > 0 ? (
                    <>
                      {' '}With {data.students.length} cadet{data.students.length === 1 ? '' : 's'} joined,
                      everyone finishing the whole game ≈{' '}
                      <strong>
                        {(goalKind === 'levels' ? TOTAL_LEVELS : MAX_STARS_PER_CADET) *
                          data.students.length}{' '}
                        {goalKind === 'levels' ? 'levels' : 'stars'}
                      </strong>
                      . Set the target a bit lower for a stretch-but-reachable goal.
                    </>
                  ) : (
                    ' Multiply by your class size, then aim a bit lower for a reachable goal.'
                  )}
                </p>
                <div className="teacher__goal-row">
                  <select
                    aria-label="Goal type"
                    value={goalKind}
                    onChange={(e) => setGoalKind(e.target.value as ClassGoalKind)}
                  >
                    <option value="stars">Stars earned together</option>
                    <option value="levels">Levels cleared together</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    aria-label="Goal target"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                  />
                  <TacticalButton
                    asset="confirm"
                    label="Save goal"
                    text="Save"
                    size="small"
                    onClick={handleSaveGoal}
                  />
                  <TacticalButton
                    asset="close"
                    label="Clear goal"
                    text="Clear"
                    size="small"
                    onClick={handleClearGoal}
                  />
                </div>
                {goalMsg && <p className="teacher__goal-msg">{goalMsg}</p>}
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
                <div className="teacher__sortbar" role="group" aria-label="Sort roster">
                  <span className="teacher__sortbar-label">Sort by</span>
                  {SORTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`teacher__sort ${sortBy === s.id ? 'teacher__sort--active' : ''}`.trim()}
                      aria-pressed={sortBy === s.id}
                      onClick={() => setSortBy(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="teacher__roster-head" role="row">
                  <span role="columnheader">Cadet</span>
                  <span role="columnheader">Last active</span>
                  <span role="columnheader">Levels</span>
                  <span role="columnheader">Stars</span>
                  <span role="columnheader">XP / Rank</span>
                  <span role="columnheader">Accuracy</span>
                </div>
                {rosterStudents.map((s) => {
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
                              {r.adaptivity && (
                                <span
                                  className={`teacher__tier teacher__tier--${r.adaptivity.tier}`}
                                  title={r.adaptivity.reason}
                                >
                                  {r.adaptivity.tier}
                                </span>
                              )}
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
