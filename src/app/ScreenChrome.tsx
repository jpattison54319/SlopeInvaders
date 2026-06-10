import type { ReactNode } from 'react';
import { assets } from '../assets/assetMap';
import { IconButton } from '../game/components/IconButton';

interface ScreenChromeProps {
  /** Back button (omitted on the root menu). */
  onBack?: () => void;
  backLabel?: string;
  onOpenSettings: () => void;
  /** Optional view toggle in the top bar (e.g. switch between galaxy and list). */
  onToggleView?: () => void;
  /** Label shown on the view-toggle button (switches with the active view). */
  toggleViewLabel?: string;
  /** Optional Pilot Profile entry in the top bar. */
  onOpenProfile?: () => void;
  children: ReactNode;
}

const BG_STYLE = {
  backgroundImage: `linear-gradient(rgba(5, 8, 24, 0.42), rgba(5, 8, 24, 0.82)), url(${assets.starfield})`,
};

/** Shared starfield page wrapper with a top bar (brand/back + settings). */
export function ScreenChrome({
  onBack,
  backLabel = 'Back',
  onOpenSettings,
  onToggleView,
  toggleViewLabel,
  onOpenProfile,
  children,
}: ScreenChromeProps) {
  return (
    <main className="menu" style={BG_STYLE}>
      <nav className="menu__topbar" aria-label="Navigation">
        <div className="menu__brand">
          {onBack ? (
            <IconButton icon="back" label={backLabel} className="chrome-icon-btn" onClick={onBack} />
          ) : (
            <>
              <img src={assets.ship} alt="" draggable={false} />
              <span>Slope Invaders</span>
            </>
          )}
        </div>
        <div className="menu__actions">
          {onOpenProfile && (
            <button type="button" className="chrome-toggle-btn" onClick={onOpenProfile}>
              Pilot Profile
            </button>
          )}
          {onToggleView && (
            <button type="button" className="chrome-toggle-btn" onClick={onToggleView}>
              {toggleViewLabel}
            </button>
          )}
          <IconButton icon="settings" label="Settings" className="chrome-icon-btn" onClick={onOpenSettings} />
        </div>
      </nav>
      {children}
    </main>
  );
}
