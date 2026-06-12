import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { icons, type IconKey } from '../../assets/assetMap';
import { TacticalButton } from './TacticalButton';
import { useFocusTrap } from '../../app/useFocusTrap';
import { modalBackdrop, modalSlideUp } from '../../app/animation';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  icon?: IconKey;
}

export function Modal({ title, onClose, children, icon }: ModalProps) {
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
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        onClick={onClose}
        variants={modalBackdrop}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div
          ref={dialogRef}
          className="modal tactical-modal"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          variants={modalSlideUp}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <header className={`modal__header ${icon ? 'modal__header--with-icon' : ''}`.trim()}>
            {icon && <img className="modal__icon" src={icons[icon]} alt="" draggable={false} />}
            <h2>{title}</h2>
            <TacticalButton asset="close" label="Close" size="small" className="modal__close" onClick={onClose} />
          </header>
          <div className="modal__body">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}