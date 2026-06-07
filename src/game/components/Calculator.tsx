import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { formatResult, safeEvaluate } from './calc';
import {
  CALCULATOR_POSITION_STORAGE_KEY,
  type CalculatorPosition,
  type CalculatorRect,
  clampCalculatorPosition,
  defaultCalculatorPosition,
  parseCalculatorPosition,
  serializeCalculatorPosition,
} from './calculatorPosition';

interface CalculatorProps {
  /** Close the panel. */
  onClose: () => void;
}

/** Characters the editable display accepts (ASCII + display operators). */
const ALLOWED = /^[0-9+\-*/().×÷−\s]*$/;

/** Button grid, row by row. '−' '×' '÷' are display glyphs (mapped on eval). */
const KEYS: string[][] = [
  ['C', '⌫', '(', ')'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['0', '.', '=', '+'],
];

const FALLBACK_PANEL_SIZE = { width: 220, height: 364 };

interface DragState {
  offsetX: number;
  offsetY: number;
  last: CalculatorPosition;
}

function getViewportSize() {
  return {
    width: document.documentElement.clientWidth || window.innerWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
}

function getPanelSize(panel: HTMLDivElement | null) {
  if (!panel) return FALLBACK_PANEL_SIZE;
  const rect = panel.getBoundingClientRect();
  return {
    width: rect.width || FALLBACK_PANEL_SIZE.width,
    height: rect.height || FALLBACK_PANEL_SIZE.height,
  };
}

function getBoardRect(): CalculatorRect | null {
  const board = document.querySelector('.app__board');
  if (!board) return null;
  const rect = board.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function readSavedPosition() {
  try {
    return parseCalculatorPosition(window.localStorage.getItem(CALCULATOR_POSITION_STORAGE_KEY));
  } catch {
    return null;
  }
}

function savePosition(position: CalculatorPosition) {
  try {
    window.localStorage.setItem(CALCULATOR_POSITION_STORAGE_KEY, serializeCalculatorPosition(position));
  } catch {
    // Ignore unavailable storage; dragging should still work for this open panel.
  }
}

/**
 * A small, non-modal floating calculator for quick slope math (e.g.
 * `(6−2)÷(3−1)`). It deliberately does not dim or lock the board, so the
 * student can read asteroid coordinates while they compute. It's a free tool —
 * opening it has no effect on scoring (the parent only counts opens for stats).
 */
export function Calculator({ onClose }: CalculatorProps) {
  const [expr, setExpr] = useState('');
  const [position, setPosition] = useState<CalculatorPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const result = useMemo(() => safeEvaluate(expr), [expr]);

  const getClampedPosition = useCallback((next: CalculatorPosition) => {
    return clampCalculatorPosition(next, getViewportSize(), getPanelSize(panelRef.current));
  }, []);

  useLayoutEffect(() => {
    const viewport = getViewportSize();
    const panel = getPanelSize(panelRef.current);
    const saved = readSavedPosition();

    setPosition(saved ? clampCalculatorPosition(saved, viewport, panel) : defaultCalculatorPosition(getBoardRect(), viewport, panel));
  }, []);

  useEffect(() => {
    const onResize = () => {
      setPosition((current) => (current ? getClampedPosition(current) : current));
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [getClampedPosition]);

  const press = useCallback((key: string) => {
    setExpr((cur) => {
      if (key === 'C') return '';
      if (key === '⌫') return cur.slice(0, -1);
      if (key === '=') {
        const r = safeEvaluate(cur);
        return r === null ? cur : formatResult(r);
      }
      return cur + key;
    });
  }, []);

  // Enter evaluates; Escape closes. Character entry comes from the focused
  // input or the button grid, so we don't handle digits here (avoids doubles).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Enter') {
        e.preventDefault();
        press('=');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, press]);

  const beginDragAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!position) return;
      const next = getClampedPosition(position);

      dragRef.current = {
        offsetX: clientX - next.x,
        offsetY: clientY - next.y,
        last: next,
      };
      setPosition(next);
      setDragging(true);
    },
    [getClampedPosition, position],
  );

  const moveDragTo = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;

      const next = getClampedPosition({
        x: clientX - drag.offsetX,
        y: clientY - drag.offsetY,
      });
      drag.last = next;
      setPosition(next);
    },
    [getClampedPosition],
  );

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;

    dragRef.current = null;
    setDragging(false);
    savePosition(drag.last);
  }, []);

  useEffect(() => {
    if (!dragging) return undefined;

    const onMouseMove = (e: MouseEvent) => moveDragTo(e.clientX, e.clientY);
    const onMouseUp = () => endDrag();
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      moveDragTo(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => endDrag();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [dragging, endDrag, moveDragTo]);

  const beginMouseDrag = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      beginDragAt(e.clientX, e.clientY);
    },
    [beginDragAt],
  );

  const beginTouchDrag = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      e.preventDefault();
      beginDragAt(touch.clientX, touch.clientY);
    },
    [beginDragAt],
  );

  return (
    <div
      ref={panelRef}
      className={`calculator${position ? '' : ' calculator--measuring'}${dragging ? ' calculator--dragging' : ''}`}
      role="dialog"
      aria-label="Calculator"
      style={{
        left: position ? `${position.x}px` : 0,
        top: position ? `${position.y}px` : 0,
      }}
    >
      <div className="calculator__bar">
        <div
          className="calculator__drag-handle"
          title="Drag calculator"
          onMouseDown={beginMouseDrag}
          onTouchStart={beginTouchDrag}
        >
          <span className="calculator__title">🧮 Calc</span>
        </div>
        <button
          type="button"
          className="calculator__close"
          aria-label="Close calculator"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <input
        className="calculator__display"
        aria-label="Calculator expression"
        value={expr}
        placeholder="(6−2)÷(3−1)"
        inputMode="decimal"
        autoFocus
        onChange={(e) => {
          if (ALLOWED.test(e.target.value)) setExpr(e.target.value);
        }}
      />
      <div className="calculator__result" aria-live="polite">
        {result === null ? ' ' : `= ${formatResult(result)}`}
      </div>

      <div className="calculator__grid">
        {KEYS.flat().map((k) => (
          <button
            key={k}
            type="button"
            className={`calculator__key${k === '=' ? ' calculator__key--equals' : ''}`}
            aria-label={k === '⌫' ? 'Backspace' : k === 'C' ? 'Clear' : k}
            onClick={() => press(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
