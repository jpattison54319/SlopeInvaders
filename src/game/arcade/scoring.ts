export interface ArcadeTargetScore {
  moving: boolean;
}

export interface ArcadeScoreResult {
  points: number;
  streak: number;
  multiplier: number;
  awards: number[];
}

export function multiplierForStreak(streak: number): number {
  if (streak >= 10) return 3;
  if (streak >= 6) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

export function scoreArcadeHit(
  currentStreak: number,
  targets: readonly ArcadeTargetScore[],
): ArcadeScoreResult {
  if (targets.length === 0) {
    return { points: 0, streak: 0, multiplier: 1, awards: [] };
  }

  const streak = currentStreak + targets.length;
  const multiplier = multiplierForStreak(streak);
  const awards = targets.map((target, index) => {
    const targetPoints = 100 + (target.moving ? 50 : 0);
    const multiHitBonus = index > 0 ? 50 : 0;
    return Math.round((targetPoints + multiHitBonus) * multiplier);
  });

  return {
    points: awards.reduce((sum, award) => sum + award, 0),
    streak,
    multiplier,
    awards,
  };
}
