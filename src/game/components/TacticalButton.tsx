import type { ButtonHTMLAttributes } from 'react';
import { uiButtons, type UiButtonKey } from '../../assets/assetMap';

interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asset: UiButtonKey;
  label: string;
  text?: string;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
  /** Optional keyboard-shortcut chip shown on the button (mouse devices only). */
  keyHint?: string;
}

/** Asset-backed command button with paired normal and active artwork. */
export function TacticalButton({
  asset,
  label,
  text,
  selected = false,
  size = 'medium',
  keyHint,
  className,
  ...rest
}: TacticalButtonProps) {
  const art = uiButtons[asset];

  return (
    <button
      type="button"
      className={`tactical-button tactical-button--${size} ${
        text ? 'tactical-button--labeled' : 'tactical-button--icon'
      } ${selected ? 'tactical-button--selected' : ''} ${className ?? ''}`.trim()}
      aria-label={label}
      title={label}
      aria-pressed={rest['aria-pressed'] ?? (selected || undefined)}
      {...rest}
    >
      <span className="tactical-button__art" aria-hidden="true">
        <img className="tactical-button__image tactical-button__image--default" src={art.default} alt="" draggable={false} />
        <img className="tactical-button__image tactical-button__image--active" src={art.active} alt="" draggable={false} />
      </span>
      {text && <span className="tactical-button__label">{text}</span>}
      {keyHint && <kbd className="key-hint key-hint--button">{keyHint}</kbd>}
    </button>
  );
}
