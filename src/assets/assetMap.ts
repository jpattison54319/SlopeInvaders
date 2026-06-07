/**
 * assetMap — single source of truth for sprite, icon, and audio URLs.
 *
 * Sprites/icons were sliced from the downloaded "SpaceShooterAssetPack" sheets
 * into individual pixel-art PNGs (nearest-neighbour upscaled for crisp edges)
 * and imported through Vite so they are hashed and base-path aware in the build.
 *
 * Art still represented in code (no sprite available) — see the Konva
 * components for pixel-art placeholders that match the 8-bit space vibe:
 *   • asteroids & weak points  → Asteroid.tsx
 *   • walls / shields & gaps   → Wall.tsx (stub)
 *   • planets                  → TODO
 *   • linked-asteroid links    → TODO
 */
import shipUrl from './ship.png';
import shipArrowUrl from './ship-arrow.png';
import boltUrl from './bolt.png';
import starfieldUrl from './starfield.png';

// UI icon tiles (from the asset pack's UI sheet).
import iconSettingsUrl from './icon-settings.png';
import iconPlayUrl from './icon-play.png';
import iconMusicUrl from './icon-music.png';
import iconCloseUrl from './icon-close.png';
import iconTrophyUrl from './icon-trophy.png';
import iconNextUrl from './icon-next.png';
import iconBackUrl from './icon-back.png';

// Heart/life sprites (sliced from the pixel heart sheet).
import heartFullUrl from './heart-full.png';
import heartHalfUrl from './heart-half.png';
import heartEmptyUrl from './heart-empty.png';

// Background music tracks (provided by the user).
import musicMenuUrl from './homescreen_background.mp3';
import musicGameUrl from './in_game.mp3';

// One-shot sound effects (provided by the user).
import sfxLaserUrl from './laser.wav';
import sfxExplosionUrl from './explosion.wav';
import sfxButtonUrl from './button-click.wav';

export const assets = {
  /** Player cannon (green pixel-art ship). */
  ship: shipUrl,
  /** Alternate arrow-style ship, available for future levels/players. */
  shipArrow: shipArrowUrl,
  /** Projectile bolt that travels along the equation line. */
  bolt: boltUrl,
  /** Tileable starfield used behind the coordinate plane and menus. */
  starfield: starfieldUrl,
} as const;

/** UI icon-button sprites (gold glyph on a blue tile). */
export const icons = {
  settings: iconSettingsUrl,
  play: iconPlayUrl,
  music: iconMusicUrl,
  close: iconCloseUrl,
  trophy: iconTrophyUrl,
  next: iconNextUrl,
  back: iconBackUrl,
} as const;

/** Heart/life sprites (full, half, empty). */
export const sprites = {
  heartFull: heartFullUrl,
  heartHalf: heartHalfUrl,
  heartEmpty: heartEmptyUrl,
} as const;

/** Looping background music. */
export const music = {
  menu: musicMenuUrl,
  game: musicGameUrl,
} as const;

/** One-shot sound effects. */
export const sfx = {
  laser: sfxLaserUrl,
  explosion: sfxExplosionUrl,
  button: sfxButtonUrl,
} as const;

export type AssetKey = keyof typeof assets;
export type IconKey = keyof typeof icons;
export type SpriteKey = keyof typeof sprites;
export type SfxKey = keyof typeof sfx;
