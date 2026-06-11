/**
 * useFocusTrap — focus-management hook for modal dialogs and overlays.
 *
 * Improvement #8: keyboard-only / screen-reader users need focus to stay inside
 * a modal while it's open, and to return to the trigger element when it closes.
 * Native `<dialog>` would handle this for us but Konva's `aria-modal` and our
 * custom Tactical UI keep the existing modal pattern; this hook bridges the
 * accessibility gap.
 *
 * Behaviour:
 *   - On mount, focus the first focusable child (or `initialFocus` if given).
 *   - Tab / Shift+Tab cycle through focusable children inside `containerRef`.
 *   - On unmount, restore focus to the element that was focused when the
 *     hook mounted (typically the button that opened the modal).
 */
import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  initialFocus?: () => HTMLElement | null,
): void {
  useEffect(() => {
    if (!isActive) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    // Remember whatever was focused before the modal opened so we can restore
    // it on close. Without this, the user's keyboard cursor gets dumped to
    // <body> when the modal closes.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Focus the first focusable element inside the modal, or the supplied
    // `initialFocus` callback (used by ControlsSettings to land on the listening
    // row).
    const target = initialFocus?.() ?? firstFocusable(container);
    target?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusables(container);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Restore focus only if the previously-focused element is still in the
      // DOM. (React Strict Mode double-mounts effects in dev, so the ref is
      // still around even on the first cleanup.)
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, isActive, initialFocus]);
}

function getFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
  );
}

function firstFocusable(container: HTMLElement): HTMLElement | null {
  return getFocusables(container)[0] ?? null;
}
