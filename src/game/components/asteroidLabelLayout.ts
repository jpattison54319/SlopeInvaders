export interface CoordinateLabelLayout {
  xOffset: number;
  width: number;
  wrap: 'none';
}

const DEFAULT_FONT_SIZE = 11;
const MONOSPACE_WIDTH_RATIO = 0.68;
const HORIZONTAL_PADDING = 6;

export function coordinateLabelLayout(
  label: string,
  rockPx: number,
  fontSize = DEFAULT_FONT_SIZE,
): CoordinateLabelLayout {
  const textWidth = Math.ceil(label.length * fontSize * MONOSPACE_WIDTH_RATIO + HORIZONTAL_PADDING);
  const width = Math.max(rockPx, textWidth);
  return {
    xOffset: -width / 2,
    width,
    wrap: 'none',
  };
}
