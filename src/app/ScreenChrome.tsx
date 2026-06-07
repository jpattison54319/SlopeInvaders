import type { ReactNode } from 'react';
import { assets } from '../assets/assetMap';
import { IconButton } from '../game/components/IconButton';

interface ScreenChromeProps {
  /** Back button (omitted on the root menu). */
  onBack?: () => void;
  backLabel?: string;
  onOpenSettings: () => void;
  children: ReactNode;
}

const BG_STYLE = {
  backgroundImage: `linear-gradient(rgba(5, 8, 24, 0.42), rgba(5, 8, 24, 0.82)), url(${assets.starfield})`,
};

/** Shared starfield page wrapper with a top bar (brand/back + settings). */
export function ScreenChrome({ onBack, backLabel = 'Back', onOpenSettings, children }: ScreenChromeProps) {
  return (
    <main className="menu" style={BG_STYLE}>
      <nav className="menu__topbar" aria-label="Navigation">
        <div className="menu__brand">
          {onBack ? (
            <IconButton icon="back" label={backLabel} text={backLabel} onClick={onBack} />
          ) : (
            <>
              <img src={assets.ship} alt="" draggable={false} />
              <span>Slope Invaders</span>
            </>
          )}
        </div>
        <div className="menu__actions">
          <IconButton icon="settings" label="Settings" text="Settings" onClick={onOpenSettings} />
        </div>
      </nav>
      {children}
    </main>
  );
}
