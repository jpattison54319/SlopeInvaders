/**
 * Shared canvas colors. Konva draws to <canvas>, so it can't read CSS custom
 * properties — these constants keep the board's palette consistent with the
 * surrounding UI (see styles/global.css for the matching values).
 */
export const COLORS = {
  space: '#070b20',
  gridMinor: 'rgba(94, 241, 255, 0.10)',
  gridMajor: 'rgba(94, 241, 255, 0.22)',
  axis: '#7fa8e6',
  axisLabel: '#9fb6dd',
  preview: '#ffd166', // amber dashed aiming line
  beam: '#5ef1ff', // cyan laser
  beamCore: '#ffffff',
  rock: '#7b8694',
  rockDark: '#4b5563',
  rockLight: '#a7b1bf',
  crater: '#39404d',
  weakPoint: '#ff4d6d',
  weakPointGlow: '#ff90a6',
  explosion: '#ffd166',
  wall: '#5ef1ff',
} as const;
