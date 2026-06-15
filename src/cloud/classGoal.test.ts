import { describe, it, expect } from 'vitest';
import { classGoalProgress, type ClassGoal } from './classGoal';

const goal = (over: Partial<ClassGoal>): ClassGoal => ({
  name: 'Class',
  kind: 'stars',
  target: 100,
  current: 0,
  members: 3,
  ...over,
});

describe('classGoalProgress', () => {
  it('is inactive when there is no goal or no target', () => {
    expect(classGoalProgress(null).active).toBe(false);
    expect(classGoalProgress(goal({ kind: null })).active).toBe(false);
    expect(classGoalProgress(goal({ target: 0 })).active).toBe(false);
  });

  it('computes a clamped percent and the collective caption', () => {
    const p = classGoalProgress(goal({ current: 40, target: 100 }));
    expect(p.active).toBe(true);
    expect(p.percent).toBe(40);
    expect(p.reached).toBe(false);
    expect(p.label).toBe('Stars earned together');
  });

  it('clamps over-target progress to 100 and marks it reached', () => {
    const p = classGoalProgress(goal({ current: 250, target: 100 }));
    expect(p.percent).toBe(100);
    expect(p.reached).toBe(true);
  });

  it('labels a levels goal distinctly', () => {
    expect(classGoalProgress(goal({ kind: 'levels', current: 5, target: 20 })).label).toBe(
      'Levels cleared together',
    );
  });
});
