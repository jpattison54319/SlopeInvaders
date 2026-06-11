import type { ReactNode } from 'react';
import { assets, uiBackgrounds, type UiButtonKey } from '../assets/assetMap';
import { TacticalButton } from '../game/components/TacticalButton';

interface ScreenChromeProps {
  /** Back button (omitted on the root menu). */
  onBack?: () => void;
  backLabel?: string;
  onOpenSettings: () => void;
  /** Optional view toggle in the top bar (e.g. switch between galaxy and list). */
  onToggleView?: () => void;
  /** Label shown on the view-toggle button (switches with the active view). */
  toggleViewLabel?: string;
  /** Explicit icon for the view-toggle command. */
  toggleViewIcon?: Extract<UiButtonKey, 'list' | 'planet'>;
  /** Optional Pilot Profile entry in the top bar. */
  onOpenProfile?: () => void;
  /** Optional keyboard-shortcuts entry (improvement #8). */
  onOpenShortcuts?: () => void;
  children: ReactNode;
}

const BG_STYLE = {
  backgroundImage: `linear-gradient(rgba(3, 7, 20, 0.5), rgba(3, 7, 20, 0.88)), url(${uiBackgrounds.cockpit})`,
};

/** Shared starfield page wrapper with a top bar (brand/back + settings). */
export function ScreenChrome({
  onBack,
  backLabel = 'Back',
  onOpenSettings,
  onToggleView,
  toggleViewLabel,
  toggleViewIcon,
  onOpenProfile,
  onOpenShortcuts,
  children,
}: ScreenChromeProps) {
  return (
    <main className="menu" style={BG_STYLE}>
      <nav className="menu__topbar" aria-label="Navigation">
        <div className="menu__brand">
          {onBack ? (
            <TacticalButton asset="back" label={backLabel} size="small" onClick={onBack} />
          ) : (
            <>
              <img src={assets.ship} alt="" draggable={false} />
              <span>Slope Invaders</span>
            </>
          )}
        </div>
        <div className="menu__actions">
          {onOpenProfile && (
            <TacticalButton asset="profile" label="Pilot Profile" size="small" onClick={onOpenProfile} />
          )}
          {onToggleView && toggleViewIcon && (
            <TacticalButton
              asset={toggleViewIcon}
              label={toggleViewLabel ?? 'Change view'}
              size="small"
              onClick={onToggleView}
            />
          )}
          {onOpenShortcuts && (
            <TacticalButton
              asset="info"
              label="Keyboard shortcuts (?)"
              size="small"
              onClick={onOpenShortcuts}
            />
          )}
          <TacticalButton asset="settings" label="Settings" size="small" onClick={onOpenSettings} />
        </div>
      </nav>
      {children}
    </main>
  );
}
