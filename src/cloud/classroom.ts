/**
 * Thin wrappers over the Supabase RPCs that back the classroom feature. All
 * mutating/reading paths go through `SECURITY DEFINER` functions gated on
 * unguessable codes (join code / student id / teacher key) — there is no auth,
 * so the codes themselves are the capability.
 *
 * `pushProgress` is best-effort and silent: a failed sync never disrupts
 * gameplay (localStorage stays canonical). The create/join/dashboard calls are
 * user-initiated and surface errors to their screens.
 */
import { getSupabase } from './supabaseClient';
import {
  getCadetName,
  getJoinedClassroom,
  getOrCreateStudentId,
} from './identity';
import type {
  LevelAdaptivityInfo,
  LevelResultPayload,
  ProgressPayload,
} from './progressPayload';
import type { ClassGoal, ClassGoalKind } from './classGoal';

export interface ClassroomInfo {
  classroomId: string;
  name: string;
  joinCode: string;
}

export interface CreatedClassroom extends ClassroomInfo {
  teacherKey: string;
}

/** A roster entry as returned by `get_class_dashboard`. */
export interface DashboardStudent {
  studentId: string;
  cadetName: string;
  lastSeen: string | null;
  levelsCompleted: number;
  totalStars: number;
  totalXp: number;
  rank: string;
  totalShots: number;
  totalHits: number;
}

export interface DashboardLevelResult {
  studentId: string;
  levelId: string;
  stars: number;
  score: number;
  accuracy: number;
  attempts: number;
  completedAt: string | null;
  /**
   * Teacher-only adaptivity transparency: the tier this level resolves to and
   * why. Null for rows synced before migration 0003 / older clients.
   */
  adaptivity: LevelAdaptivityInfo | null;
}

export interface DashboardData {
  classroom: ClassroomInfo;
  students: DashboardStudent[];
  levelResults: DashboardLevelResult[];
}

/** Defensive parse of the `adaptivity` object riding in the stats jsonb. */
function parseAdaptivity(stats: unknown): LevelAdaptivityInfo | null {
  if (!stats || typeof stats !== 'object') return null;
  const a = (stats as { adaptivity?: unknown }).adaptivity;
  if (!a || typeof a !== 'object') return null;
  const { tier, ema, sampleCount, reason } = a as Record<string, unknown>;
  if (tier !== 'support' && tier !== 'standard' && tier !== 'challenge') return null;
  return {
    tier,
    ...(typeof ema === 'number' && Number.isFinite(ema) ? { ema } : {}),
    sampleCount: typeof sampleCount === 'number' ? sampleCount : 0,
    reason: typeof reason === 'string' ? reason : '',
  };
}

class CloudDisabledError extends Error {
  constructor() {
    super('Classroom cloud is not configured.');
    this.name = 'CloudDisabledError';
  }
}

/** Create a class and return its share code + secret teacher key. */
export async function createClassroom(name: string): Promise<CreatedClassroom> {
  const supabase = getSupabase();
  if (!supabase) throw new CloudDisabledError();
  const { data, error } = await supabase.rpc('create_classroom', { p_name: name.trim() });
  if (error) throw error;
  const row = data as { classroom_id: string; name: string; join_code: string; teacher_key: string };
  return {
    classroomId: row.classroom_id,
    name: row.name,
    joinCode: row.join_code,
    teacherKey: row.teacher_key,
  };
}

/** Join a class by its share code, registering this device's student id. */
export async function joinClassroom(joinCode: string, cadetName: string): Promise<ClassroomInfo> {
  const supabase = getSupabase();
  if (!supabase) throw new CloudDisabledError();
  const { data, error } = await supabase.rpc('join_classroom', {
    p_join_code: joinCode.trim().toUpperCase(),
    p_student_id: getOrCreateStudentId(),
    p_cadet_name: cadetName.trim(),
  });
  if (error) throw error;
  const row = data as { classroom_id: string; name: string; join_code: string };
  return { classroomId: row.classroom_id, name: row.name, joinCode: row.join_code };
}

/** Best-effort progress sync; no-op when cloud is off or no class is joined. */
export async function pushProgress(payload: ProgressPayload): Promise<void> {
  const supabase = getSupabase();
  const joined = getJoinedClassroom();
  if (!supabase || !joined) return;
  try {
    const { error } = await supabase.rpc('sync_progress', {
      p_student_id: getOrCreateStudentId(),
      p_cadet_name: getCadetName(),
      p_summary: payload.summary,
      p_levels: payload.levels as LevelResultPayload[],
    });
    if (error) throw error;
  } catch {
    /* best-effort: gameplay must never break on a failed sync */
  }
}

/** Load a class dashboard, gated entirely by the secret teacher key. */
export async function getDashboard(teacherKey: string): Promise<DashboardData> {
  const supabase = getSupabase();
  if (!supabase) throw new CloudDisabledError();
  const { data, error } = await supabase.rpc('get_class_dashboard', { p_teacher_key: teacherKey });
  if (error) throw error;
  const row = data as {
    classroom: { id: string; name: string; join_code: string };
    students: Array<Record<string, unknown>>;
    level_results: Array<Record<string, unknown>>;
  };
  return {
    classroom: {
      classroomId: row.classroom.id,
      name: row.classroom.name,
      joinCode: row.classroom.join_code,
    },
    students: (row.students ?? []).map((s) => ({
      studentId: String(s.student_id),
      cadetName: String(s.cadet_name ?? ''),
      lastSeen: (s.last_seen as string | null) ?? null,
      levelsCompleted: Number(s.levels_completed ?? 0),
      totalStars: Number(s.total_stars ?? 0),
      totalXp: Number(s.total_xp ?? 0),
      rank: String(s.rank ?? 'Cadet'),
      totalShots: Number(s.total_shots ?? 0),
      totalHits: Number(s.total_hits ?? 0),
    })),
    levelResults: (row.level_results ?? []).map((r) => ({
      studentId: String(r.student_id),
      levelId: String(r.level_id),
      stars: Number(r.stars ?? 0),
      score: Number(r.score ?? 0),
      accuracy: Number(r.accuracy ?? 0),
      attempts: Number(r.attempts ?? 0),
      completedAt: (r.completed_at as string | null) ?? null,
      adaptivity: parseAdaptivity(r.stats),
    })),
  };
}

/** Teacher sets (or clears, with kind = null) the class's cooperative goal. */
export async function setClassGoal(
  teacherKey: string,
  kind: ClassGoalKind | null,
  target: number,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new CloudDisabledError();
  const { error } = await supabase.rpc('set_class_goal', {
    p_teacher_key: teacherKey,
    p_kind: kind,
    p_target: Math.max(0, Math.round(target)),
  });
  if (error) throw error;
}

/**
 * Read the class's collective goal progress by join code. Returns only class
 * totals (no per-student data). Best-effort: returns null when cloud is off.
 */
export async function getClassGoal(joinCode: string): Promise<ClassGoal | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_class_goal', {
    p_join_code: joinCode.trim().toUpperCase(),
  });
  if (error) throw error;
  const d = (data ?? {}) as Record<string, unknown>;
  const kind = d.kind === 'stars' || d.kind === 'levels' ? d.kind : null;
  return {
    name: String(d.name ?? ''),
    kind,
    target: d.target == null ? null : Number(d.target),
    current: Number(d.current ?? 0),
    members: Number(d.members ?? 0),
  };
}
