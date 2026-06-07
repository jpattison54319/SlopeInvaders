/**
 * A hand-drawn pixel-art calculator glyph (display + a grid of keys: +, ×, C,
 * −, ÷, =). Rendered as crisp-edged SVG rectangles so it stays sharp at the
 * small game-bar size, like the other 8-bit UI icons.
 */
export function CalculatorIcon({ className }: { className?: string }) {
  const body = '#3a4070';
  const bodyTop = '#4c5596';
  const outline = '#161a3a';
  const screen = '#0a1130';
  const digit = '#5ef1ff';
  const key = '#dfe7f5';
  const accent = '#ffd166';
  const sym = '#1d2348';

  return (
    <svg
      className={className}
      viewBox="0 0 18 20"
      shapeRendering="crispEdges"
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Casing */}
      <rect x="1" y="1" width="16" height="18" fill={outline} />
      <rect x="2" y="2" width="14" height="16" fill={body} />
      <rect x="2" y="2" width="14" height="2" fill={bodyTop} />

      {/* Display */}
      <rect x="3" y="4" width="12" height="4" fill={screen} />
      <rect x="10" y="5" width="1" height="2" fill={digit} />
      <rect x="12" y="5" width="1" height="2" fill={digit} />
      <rect x="13" y="5" width="1" height="2" fill={digit} />

      {/* Keys (light) and one amber accent key */}
      <rect x="3" y="9" width="3" height="3" fill={key} />
      <rect x="7" y="9" width="3" height="3" fill={key} />
      <rect x="11" y="9" width="3" height="3" fill={accent} />
      <rect x="3" y="13" width="3" height="3" fill={key} />
      <rect x="7" y="13" width="3" height="3" fill={key} />
      <rect x="11" y="13" width="3" height="3" fill={key} />

      {/* + */}
      <rect x="4" y="9" width="1" height="3" fill={sym} />
      <rect x="3" y="10" width="3" height="1" fill={sym} />

      {/* × */}
      <rect x="7" y="9" width="1" height="1" fill={sym} />
      <rect x="9" y="9" width="1" height="1" fill={sym} />
      <rect x="8" y="10" width="1" height="1" fill={sym} />
      <rect x="7" y="11" width="1" height="1" fill={sym} />
      <rect x="9" y="11" width="1" height="1" fill={sym} />

      {/* C */}
      <rect x="11" y="9" width="3" height="1" fill={sym} />
      <rect x="11" y="10" width="1" height="1" fill={sym} />
      <rect x="11" y="11" width="3" height="1" fill={sym} />

      {/* − */}
      <rect x="3" y="14" width="3" height="1" fill={sym} />

      {/* ÷ */}
      <rect x="8" y="13" width="1" height="1" fill={sym} />
      <rect x="7" y="14" width="3" height="1" fill={sym} />
      <rect x="8" y="15" width="1" height="1" fill={sym} />

      {/* = */}
      <rect x="11" y="13" width="3" height="1" fill={sym} />
      <rect x="11" y="15" width="3" height="1" fill={sym} />
    </svg>
  );
}
