/**
 * SkipLink — accessibility helper.
 *
 * Improvement #8: lets keyboard-only users skip past the navigation chrome to
 * the page's main content. The link is visually hidden until it receives
 * focus (`:focus-visible`), at which point it slides in at the top of the
 * viewport. Each screen sets its own `targetId` to the id of its main
 * content region.
 */
interface SkipLinkProps {
  /** The id of the element to jump to. */
  targetId: string;
  /** Accessible label, e.g. "Skip to main content". */
  label?: string;
}

export function SkipLink({ targetId, label = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      className="skip-link"
      href={`#${targetId}`}
      onClick={(e) => {
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          target.setAttribute('tabindex', '-1');
          target.focus();
          // Remove the tabindex on blur so it doesn't break the natural tab order.
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
      }}
    >
      {label}
    </a>
  );
}
