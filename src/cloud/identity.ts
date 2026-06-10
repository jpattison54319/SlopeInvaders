/**
 * Account-free identity for the classroom cloud layer.
 *
 * There are no logins or passwords. A learner is identified by:
 *  - a device-generated UUID (`student-id`), minted once and kept in
 *    localStorage — this is the row key in the cloud `students` table, and
 *  - a freely-chosen cadet name (display only).
 *
 * Teachers are identified by possession of an unguessable `teacher_key`
 * (capability URL). A teacher's own device remembers the classes it created so
 * it can reopen their dashboards without the link.
 *
 * All values live in localStorage; this module is pure w.r.t. its inputs and
 * safe to call when storage is unavailable (private mode / SSR).
 */

const STUDENT_ID_KEY = 'slope-invaders:student-id';
const CADET_NAME_KEY = 'slope-invaders:cadet-name';
const CLASSROOM_KEY = 'slope-invaders:classroom';
const TEACHER_KEYS_KEY = 'slope-invaders:teacher-keys';

/** The class a student has joined (or null). */
export interface JoinedClassroom {
  classroomId: string;
  joinCode: string;
  name: string;
}

/** A class this device created as a teacher (so its dashboard is re-openable). */
export interface TeacherClass {
  classroomId: string;
  name: string;
  joinCode: string;
  teacherKey: string;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw != null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore (private mode / unavailable storage) */
  }
}

/** A v4-ish UUID, preferring the platform generator when present. */
function newUuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to manual generation */
  }
  // Fallback for non-secure contexts / very old environments.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** The stable per-device student id, minting one on first use. */
export function getOrCreateStudentId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(STUDENT_ID_KEY);
  } catch {
    /* ignore */
  }
  if (id) return id;
  id = newUuid();
  try {
    localStorage.setItem(STUDENT_ID_KEY, id);
  } catch {
    /* ignore — id stays in-memory for this session only */
  }
  return id;
}

export function getCadetName(): string {
  try {
    return localStorage.getItem(CADET_NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setCadetName(name: string): void {
  try {
    localStorage.setItem(CADET_NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

export function getJoinedClassroom(): JoinedClassroom | null {
  return readJSON<JoinedClassroom | null>(CLASSROOM_KEY, null);
}

export function setJoinedClassroom(record: JoinedClassroom): void {
  writeJSON(CLASSROOM_KEY, record);
}

export function clearJoinedClassroom(): void {
  try {
    localStorage.removeItem(CLASSROOM_KEY);
  } catch {
    /* ignore */
  }
}

export function getTeacherClasses(): TeacherClass[] {
  const list = readJSON<TeacherClass[]>(TEACHER_KEYS_KEY, []);
  return Array.isArray(list) ? list : [];
}

/** Remember (or update) a class this device created as a teacher. */
export function addTeacherClass(record: TeacherClass): void {
  const existing = getTeacherClasses().filter((c) => c.classroomId !== record.classroomId);
  writeJSON(TEACHER_KEYS_KEY, [record, ...existing]);
}
