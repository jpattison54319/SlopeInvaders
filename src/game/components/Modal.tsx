import { useEffect, useRef, type ReactNode } from 'react';
import { icons, type IconKey } from '../../assets/assetMap';
import { TacticalButton } from './TacticalButton';
import { useFocusTrap } from '../../app/useFocusTrap';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional icon shown in the header (asset-map glyph). */
  icon?: IconKey;
  /** Optional custom icon node (e.g. an inline SVG), shown in the same slot. */
  iconNode?: ReactNode;
}

/** A centered dialog over a dimmed backdrop. Closes on Esc, backdrop click, or ✕. */
export function Modal({ title, onClose, children, icon, iconNode }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal tactical-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`modal__header ${icon || iconNode ? 'modal__header--with-icon' : ''}`.trim()}>
          {iconNode ? (
            <span className="modal__icon modal__icon--node" aria-hidden>
              {iconNode}
            </span>
          ) : (
            icon && <img className="modal__icon" src={icons[icon]} alt="" draggable={false} />
          )}
          <h2>{title}</h2>
          <TacticalButton asset="close" label="Close" size="small" className="modal__close" onClick={onClose} />
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
