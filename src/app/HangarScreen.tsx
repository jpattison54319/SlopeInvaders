import type { CSSProperties } from 'react';
import { ScreenChrome } from './ScreenChrome';
import { shipSprites } from '../assets/assetMap';
import {
  COSMETICS,
  cosmeticsByKind,
  describeUnlock,
  kindNoun,
  type CosmeticItem,
  type CosmeticKind,
  type LaserStyle,
  type ShipSkin,
  type ThemeStyle,
} from '../game/campaign/cosmetics';
import type { CampaignProgress } from './useCampaignProgress';
import type { EquippedCosmetics, LoadoutController } from './useLoadout';

interface HangarScreenProps {
  progress: CampaignProgress;
  loadout: LoadoutController;
  backLabel?: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

const KIND_SECTIONS: ReadonlyArray<{ kind: CosmeticKind; title: string; blurb: string }> = [
  { kind: 'ship', title: 'Ship Hulls', blurb: 'The cannon you fly into every mission.' },
  { kind: 'laser', title: 'Laser Styles', blurb: 'The colour and bite of your projectile.' },
  { kind: 'theme', title: 'Cockpit Themes', blurb: 'Recolour the whole command deck.' },
];

/** A small visual preview chip for any cosmetic item. */
function CosmeticPreview({ item }: { item: CosmeticItem }) {
  if (item.kind === 'ship') {
    const ship = item as ShipSkin;
    return (
      <span className="cosmetic-preview cosmetic-preview--ship" aria-hidden>
        <img
          src={shipSprites[ship.sprite]}
          alt=""
          draggable={false}
          style={{ filter: ship.hue ? `hue-rotate(${ship.hue}deg)` : undefined }}
        />
      </span>
    );
  }
  if (item.kind === 'laser') {
    const laser = item as LaserStyle;
    return (
      <span
        className="cosmetic-preview cosmetic-preview--laser"
        aria-hidden
        style={
          {
            '--beam': laser.beam,
            '--beam-core': laser.beamCore,
          } as CSSProperties
        }
      >
        <span className="cosmetic-preview__beam" />
      </span>
    );
  }
  const theme = item as ThemeStyle;
  return (
    <span
      className="cosmetic-preview cosmetic-preview--theme"
      aria-hidden
      style={{
        background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
      }}
    >
      <span className="cosmetic-preview__dot" style={{ background: theme.accent }} />
      <span className="cosmetic-preview__dot" style={{ background: theme.amber }} />
    </span>
  );
}

/**
 * The Hangar: the personalization bay where pilots browse and equip cosmetic
 * ships, lasers, and themes earned through play. Locked items read as upcoming
 * rewards with a clear "how to unlock" hint. Cosmetics are purely visual and
 * never affect gameplay (docs/agent/03-gamification-multiplayer.md).
 */
export function HangarScreen({
  progress,
  loadout,
  backLabel = 'Back',
  onBack,
  onOpenSettings,
}: HangarScreenProps) {
  const earned = progress.getEarnedCosmetics();
  const { equipped, equip } = loadout;
  const unlockedCount = COSMETICS.filter((c) => c.id in earned || c.unlock.type === 'default').length;

  const equippedId = (kind: CosmeticKind): string =>
    (equipped[kind] as EquippedCosmetics[CosmeticKind]).id;

  return (
    <ScreenChrome onBack={onBack} backLabel={backLabel} onOpenSettings={onOpenSettings}>
      <section className="hangar" aria-labelledby="hangar-title">
        <header className="hangar__hero">
          <div className="hangar__hero-text">
            <span className="menu__panel-label">Hangar Bay</span>
            <h2 id="hangar-title">Customize Your Cockpit</h2>
            <p>
              Equip the ships, lasers, and themes you have earned. Clear zones and bank XP to
              unlock more — every piece is purely cosmetic.
            </p>
          </div>
          <div className="hangar__loadout" aria-label="Current loadout">
            <CosmeticPreview item={equipped.ship} />
            <div className="hangar__loadout-info">
              <strong>{equipped.ship.name}</strong>
              <span>
                {equipped.laser.name} · {equipped.theme.name}
              </span>
              <span className="hangar__count">
                {unlockedCount} / {COSMETICS.length} unlocked
              </span>
            </div>
          </div>
        </header>

        {KIND_SECTIONS.map((section) => {
          const items = cosmeticsByKind(section.kind);
          const owned = items.filter((i) => i.id in earned || i.unlock.type === 'default').length;
          return (
            <section
              key={section.kind}
              className="hangar__section"
              aria-label={section.title}
            >
              <header className="profile__section-head">
                <h3>{section.title}</h3>
                <span className="profile__section-meta">
                  {owned} / {items.length} · {section.blurb}
                </span>
              </header>
              <ul className="cosmetic-grid">
                {items.map((item) => {
                  const isOwned = item.id in earned || item.unlock.type === 'default';
                  const isEquipped = equippedId(section.kind) === item.id;
                  return (
                    <li
                      key={item.id}
                      className={`cosmetic-card ${
                        isOwned ? 'cosmetic-card--owned' : 'cosmetic-card--locked'
                      } ${isEquipped ? 'cosmetic-card--equipped' : ''}`.trim()}
                    >
                      <CosmeticPreview item={item} />
                      <div className="cosmetic-card__text">
                        <span className="cosmetic-card__name">{item.name}</span>
                        <span className="cosmetic-card__desc">{item.description}</span>
                      </div>
                      {isOwned ? (
                        isEquipped ? (
                          <span className="cosmetic-card__equipped">Equipped</span>
                        ) : (
                          <button
                            type="button"
                            className="cosmetic-card__equip"
                            onClick={() => equip(item.kind, item.id)}
                          >
                            Equip {kindNoun(item.kind)}
                          </button>
                        )
                      ) : (
                        <span className="cosmetic-card__locked">
                          <span aria-hidden>🔒</span>
                          {describeUnlock(item.unlock)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </section>
    </ScreenChrome>
  );
}
