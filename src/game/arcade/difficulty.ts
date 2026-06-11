export const ARCADE_BOUNDS = { minX: -8, maxX: 8, minY: -8, maxY: 8 } as const;
export const ARCADE_VERTICES = [7, 4, 1, -2, -5] as const;
export const ARCADE_START_SHIELDS = 3;
export const ARCADE_THREATS_PER_WAVE = 5;
export const ARCADE_FALL_MS = 750;
export const ARCADE_SPAWN_GAP_MS = 900;
export const ARCADE_INTERWAVE_MS = 2000;
export const ARCADE_COUNTDOWN_MS = 3000;
export const ARCADE_SHOT_MS = 700;
export const ARCADE_HIT_RADIUS = 0.45;

export interface ArcadeDifficulty {
  holdMs: number;
  maxActive: number;
}

export function difficultyForWave(wave: number): ArcadeDifficulty {
  return {
    holdMs: Math.max(2750, 5000 - Math.max(0, wave - 1) * 250),
    maxActive: wave >= 3 ? 2 : 1,
  };
}
