/**
 * A self-contained "help" glyph — a question mark inside a tactical hex badge,
 * tinted with the app's cyan accent. Used as the Help drawer's header icon
 * (the asset map has no help-appropriate sprite).
 */
export function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width="100%"
      height="100%"
      fill="none"
      aria-hidden="true"
    >
      {/* Hex badge */}
      <path
        d="M16 2.5 27.5 9v14L16 29.5 4.5 23V9z"
        fill="rgba(94,241,255,0.12)"
        stroke="var(--cyan, #5ef1ff)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Question mark */}
      <path
        d="M12.4 12.6c0-2 1.7-3.4 3.8-3.4 2.1 0 3.7 1.3 3.7 3.2 0 1.6-1 2.4-2.1 3.1-1 .7-1.5 1.2-1.5 2.3v.5"
        stroke="var(--cyan, #5ef1ff)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.2" cy="23.2" r="1.5" fill="var(--cyan, #5ef1ff)" />
    </svg>
  );
}
