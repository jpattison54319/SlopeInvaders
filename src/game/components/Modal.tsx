import { useEffect, type ReactNode } from 'react';
import { icons, type IconKey } from '../../assets/assetMap';
import { TacticalButton } from './TacticalButton';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional icon shown in the header. */
  icon?: IconKey;
}

/** A centered dialog over a dimmed backdrop. Closes on Esc, backdrop click, or ✕. */
export function Modal({ title, onClose, children, icon }: ModalProps) {
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
        className="modal tactical-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`modal__header ${icon ? 'modal__header--with-icon' : ''}`.trim()}>
          {icon && <img className="modal__icon" src={icons[icon]} alt="" draggable={false} />}
          <h2>{title}</h2>
          <TacticalButton asset="close" label="Close" size="small" className="modal__close" onClick={onClose} />
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
