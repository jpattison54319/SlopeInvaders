import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { uiCoach } from '../../assets/assetMap';
import { TacticalButton } from './TacticalButton';

/** A single stop on the guided tour. A null selector renders a centered card. */
export interface TourStep {
  /** CSS selector for the element to spotlight, or null for a centered step. */
  selector: string | null;
  title: string;
  body: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  /** Called when the tour is skipped or finished. */
  onClose: () => void;
}

const SPOTLIGHT_PAD = 8;

/**
 * A coach-mark / spotlight tour. Darkens the screen ~70% and cuts a bright hole
 * around the current step's target element, with an explanation card and
 * Back / Next / Skip controls. Page interaction is blocked while the tour runs.
 */
export function GuidedTour({ steps, onClose }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const next = useCallback(() => {
    setIndex((i) => (i >= steps.length - 1 ? i : i + 1));
  }, [steps.length]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const finish = useCallback(() => {
    if (isLast) onClose();
    else next();
  }, [isLast, next, onClose]);

  // Measure the current target, keeping the spotlight aligned through scrolls
  // and resizes. A null selector clears the rect (centered card, no cutout).
  useLayoutEffect(() => {
    const selector = step.selector;
    const measure = () => {
      if (!selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    if (selector) {
      const el = document.querySelector(selector);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.selector, index]);

  // Place the card below the spotlight when it fits, otherwise above; fall back
  // to the screen center for stepless steps. Always clamped into the viewport.
  useLayoutEffect(() => {
    const place = () => {
      const card = cardRef.current;
      if (!card) return;
      const cw = card.offsetWidth;
      const ch = card.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 16;

      if (!rect) {
        setPos({ top: Math.max(8, (vh - ch) / 2), left: Math.max(8, (vw - cw) / 2) });
        return;
      }

      let top = rect.bottom + gap;
      if (top + ch > vh - 8) {
        const above = rect.top - gap - ch;
        top = above >= 8 ? above : Math.max(8, vh - ch - 8);
      }
      let left = rect.left + rect.width / 2 - cw / 2;
      left = Math.max(8, Math.min(left, vw - cw - 8));
      setPos({ top, left });
    };
    place();
  }, [rect, index]);

  // Keyboard navigation: arrows step, Escape skips.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        finish();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, back, onClose]);

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* Transparent layer that blocks interaction with the game behind it. */}
      <div className="tour__catch" />

      {rect ? (
        <div
          className="tour__spotlight"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
          }}
        />
      ) : (
        <div className="tour__backdrop" />
      )}

      <div className="tour__card" ref={cardRef} style={{ top: pos.top, left: pos.left }}>
        <div className="tour__header">
          <img className="tour__coach" src={uiCoach.missionControl} alt="" draggable={false} />
          <span className="tour__count">
            {index + 1} / {steps.length}
          </span>
          <button type="button" className="tour__skip" onClick={onClose}>
            Skip Tour ✕
          </button>
        </div>
        <h2 className="tour__title">{step.title}</h2>
        <p className="tour__body">{step.body}</p>
        <div className="tour__nav">
          <TacticalButton
            asset="back"
            label="Previous tour step"
            text="Back"
            className="tour__btn"
            onClick={back}
            disabled={isFirst}
          />
          <TacticalButton
            asset={isLast ? 'play' : 'forward'}
            label={isLast ? "Let's Go" : 'Next tour step'}
            text={isLast ? "Let's Go" : 'Next'}
            className="tour__btn"
            onClick={finish}
          />
        </div>
      </div>
    </div>
  );
}
