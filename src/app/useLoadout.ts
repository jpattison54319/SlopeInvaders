import { useCallback, useMemo } from 'react';
import { usePersistentState } from './usePersistentState';
import {
  DEFAULT_LOADOUT,
  getCosmetic,
  type CosmeticKind,
  type LaserStyle,
  type ShipSkin,
  type ThemeStyle,
} from '../game/campaign/cosmetics';

const LOADOUT_KEY = 'slope-invaders:loadout';

/** The player's equipped cosmetic selection (one id per kind). */
export interface Loadout {
  ship: string;
  laser: string;
  theme: string;
}

/** The resolved, validated cosmetic objects currently equipped. */
export interface EquippedCosmetics {
  ship: ShipSkin;
  laser: LaserStyle;
  theme: ThemeStyle;
}

export interface LoadoutController {
  /** The raw equipped ids (may reference a no-longer-valid id; resolve via `equipped`). */
  loadout: Loadout;
  /** The validated cosmetic objects, with defaults substituted for unknown ids. */
  equipped: EquippedCosmetics;
  /** Equip an item for its kind. */
  equip: (kind: CosmeticKind, id: string) => void;
}

function resolve<T>(id: string, fallbackId: string): T {
  return (getCosmetic(id) ?? getCosmetic(fallbackId)!) as T;
}

/**
 * Owns the equipped-cosmetics selection (ship/laser/theme), persisted to
 * localStorage. Equipping is purely visual and never affects gameplay; the
 * resolver falls back to the default item when a stored id is unknown.
 */
export function useLoadout(): LoadoutController {
  const [stored, setStored] = usePersistentState<Loadout>(LOADOUT_KEY, DEFAULT_LOADOUT);
  const loadout = useMemo<Loadout>(() => ({ ...DEFAULT_LOADOUT, ...stored }), [stored]);

  const equip = useCallback(
    (kind: CosmeticKind, id: string) => {
      setStored({ ...loadout, [kind]: id });
    },
    [loadout, setStored],
  );

  const equipped = useMemo<EquippedCosmetics>(
    () => ({
      ship: resolve<ShipSkin>(loadout.ship, DEFAULT_LOADOUT.ship),
      laser: resolve<LaserStyle>(loadout.laser, DEFAULT_LOADOUT.laser),
      theme: resolve<ThemeStyle>(loadout.theme, DEFAULT_LOADOUT.theme),
    }),
    [loadout],
  );

  return { loadout, equipped, equip };
}
