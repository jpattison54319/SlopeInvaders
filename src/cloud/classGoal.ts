/**
 * Cooperative class goal — types + pure display math (no Supabase import, so it
 * unit-tests freely). A class has at most one shared collective goal; students
 * only ever see the class TOTAL vs. the target, never a per-student breakdown,
 * keeping the learner view comparison-free (docs/agent/03).
 */
export type ClassGoalKind = 'stars' | 'levels';

export interface ClassGoal {
  name: string;
  kind: ClassGoalKind | null;
  target: number | null;
  current: number;
  members: number;
}

export interface ClassGoalProgress {
  active: boolean;
  current: number;
  target: number;
  /** 0–100, clamped. */
  percent: number;
  reached: boolean;
  /** Collective, non-comparative caption. */
  label: string;
}

export function classGoalProgress(goal: ClassGoal | null): ClassGoalProgress {
  if (!goal || !goal.kind || !goal.target || goal.target <= 0) {
    return { active: false, current: 0, target: 0, percent: 0, reached: false, label: '' };
  }
  const current = Math.max(0, Math.round(goal.current));
  const target = goal.target;
  const percent = Math.min(100, Math.round((current / target) * 100));
  return {
    active: true,
    current,
    target,
    percent,
    reached: current >= target,
    label: goal.kind === 'levels' ? 'Levels cleared together' : 'Stars earned together',
  };
}
