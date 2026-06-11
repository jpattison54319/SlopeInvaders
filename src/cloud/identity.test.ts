/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addTeacherClass,
  clearJoinedClassroom,
  getCadetName,
  getJoinedClassroom,
  getOrCreateStudentId,
  getTeacherClasses,
  setCadetName,
  setJoinedClassroom,
} from './identity';

beforeEach(() => {
  const store = new Map<string, string>();
  const storage: Storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
});

describe('identity', () => {
  it('mints a stable student id and reuses it', () => {
    const id = getOrCreateStudentId();
    expect(id).toMatch(/[0-9a-f-]{36}/i);
    expect(getOrCreateStudentId()).toBe(id);
  });

  it('round-trips the cadet name', () => {
    expect(getCadetName()).toBe('');
    setCadetName('Nova');
    expect(getCadetName()).toBe('Nova');
  });

  it('stores, reads, and clears the joined classroom', () => {
    expect(getJoinedClassroom()).toBeNull();
    setJoinedClassroom({ classroomId: 'c1', joinCode: 'ABC123', name: 'Algebra' });
    expect(getJoinedClassroom()).toEqual({ classroomId: 'c1', joinCode: 'ABC123', name: 'Algebra' });
    clearJoinedClassroom();
    expect(getJoinedClassroom()).toBeNull();
  });

  it('remembers teacher classes without duplicating by id', () => {
    addTeacherClass({ classroomId: 'c1', name: 'P1', joinCode: 'AAA111', teacherKey: 'k1' });
    addTeacherClass({ classroomId: 'c1', name: 'P1 renamed', joinCode: 'AAA111', teacherKey: 'k1' });
    addTeacherClass({ classroomId: 'c2', name: 'P2', joinCode: 'BBB222', teacherKey: 'k2' });
    const classes = getTeacherClasses();
    expect(classes).toHaveLength(2);
    expect(classes.find((c) => c.classroomId === 'c1')?.name).toBe('P1 renamed');
  });
});
