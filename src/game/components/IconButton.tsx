import type { ButtonHTMLAttributes } from 'react';
import { icons, type IconKey } from '../../assets/assetMap';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Which UI sprite to show. */
  icon: IconKey;
  /** Accessible label (also used as tooltip). */
  label: string;
  /** Optional visible text beside the icon. */
  text?: string;
}

/** A button fronted by one of the pixel-art UI icon tiles. */
export function IconButton({ icon, label, text, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn ${className ?? ''}`.trim()}
      aria-label={label}
      title={label}
      {...rest}
    >
      <img className="icon-btn__img" src={icons[icon]} alt="" draggable={false} />
      {text && <span className="icon-btn__text">{text}</span>}
    </button>
  );
}
