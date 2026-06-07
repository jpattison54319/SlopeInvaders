export interface CalculatorPosition {
  x: number;
  y: number;
}

export interface CalculatorSize {
  width: number;
  height: number;
}

export interface CalculatorRect extends CalculatorSize {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const CALCULATOR_POSITION_STORAGE_KEY = 'slope-invaders:calculator-position';
export const CALCULATOR_VIEWPORT_GUTTER = 12;
const BOARD_EDGE_INSET = 16;

export function clampCalculatorPosition(
  position: CalculatorPosition,
  viewport: CalculatorSize,
  panel: CalculatorSize,
  gutter = CALCULATOR_VIEWPORT_GUTTER,
): CalculatorPosition {
  const maxX = Math.max(gutter, viewport.width - panel.width - gutter);
  const maxY = Math.max(gutter, viewport.height - panel.height - gutter);

  return {
    x: Math.round(Math.min(Math.max(position.x, gutter), maxX)),
    y: Math.round(Math.min(Math.max(position.y, gutter), maxY)),
  };
}

export function defaultCalculatorPosition(
  board: CalculatorRect | null,
  viewport: CalculatorSize,
  panel: CalculatorSize,
): CalculatorPosition {
  const position = board
    ? {
        x: board.right - panel.width - BOARD_EDGE_INSET,
        y: board.top + BOARD_EDGE_INSET,
      }
    : {
        x: viewport.width - panel.width - CALCULATOR_VIEWPORT_GUTTER,
        y: CALCULATOR_VIEWPORT_GUTTER,
      };

  return clampCalculatorPosition(position, viewport, panel);
}

export function parseCalculatorPosition(value: string | null): CalculatorPosition | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<CalculatorPosition>;
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
    if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return null;
    return { x: Math.round(parsed.x), y: Math.round(parsed.y) };
  } catch {
    return null;
  }
}

export function serializeCalculatorPosition(position: CalculatorPosition): string {
  return JSON.stringify({
    x: Math.round(position.x),
    y: Math.round(position.y),
  });
}
