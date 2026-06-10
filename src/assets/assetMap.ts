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
 *   • linked-asteroid links    → TODO
 *
 * Planet art (galaxy mission-select) is the "Pixel Art Planets" pack by Kibyra
 * (commercial use permitted; redistribution of the original pack is not).
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
import iconPilotUrl from './icon-pilot.png';

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

// Galaxy mission-select planets (one per zone). Add more from the pack as zones ship.
import planetMoonColonyUrl from './planets/mooncolony-planet.png';
import planetSpaceGardenUrl from './planets/spacegarden-planet.png';
import planetCrystalUrl from './planets/crystal-planet.png';
import planetVolcanoUrl from './planets/volcano-planet.png';
import planetCelestialUrl from './planets/celestial-planet.png';

// Faction banners used as campaign mission markers on planet surfaces.
import bannerBlackUrl from './faction-banners/black-faction.png';
import bannerBlueUrl from './faction-banners/blue-faction.png';
import bannerBrownUrl from './faction-banners/brown-faction.png';
import bannerDarkBlueUrl from './faction-banners/dark-blue-faction.png';
import bannerDarkBrownUrl from './faction-banners/dark-brown-faction.png';
import bannerDarkerBrownUrl from './faction-banners/darker-brown-faction.png';
import bannerGoldUrl from './faction-banners/gold-faction.png';
import bannerGrayUrl from './faction-banners/gray-faction.png';
import bannerGreenUrl from './faction-banners/green-faction.png';
import bannerLightBlueUrl from './faction-banners/light-blue-faction.png';
import bannerLightBrownUrl from './faction-banners/light-brown-faction.png';
import bannerOrangeUrl from './faction-banners/orange-faction.png';
import bannerPurpleUrl from './faction-banners/purple-faction.png';
import bannerRedUrl from './faction-banners/red-faction.png';
import bannerWhiteUrl from './faction-banners/white-faction.png';

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
  /** Helmeted astronaut portrait for the Pilot Profile. */
  pilot: iconPilotUrl,
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

/** Planet sprites for the galaxy mission select (8-bit, 128×128, transparent). */
export const planets = {
  mooncolony: planetMoonColonyUrl,
  spacegarden: planetSpaceGardenUrl,
  crystal: planetCrystalUrl,
  volcano: planetVolcanoUrl,
  celestial: planetCelestialUrl,
} as const;

/** Faction banner sprites for level markers on the active planet. */
export const factionBanners = {
  black: bannerBlackUrl,
  blue: bannerBlueUrl,
  brown: bannerBrownUrl,
  darkBlue: bannerDarkBlueUrl,
  darkBrown: bannerDarkBrownUrl,
  darkerBrown: bannerDarkerBrownUrl,
  gold: bannerGoldUrl,
  gray: bannerGrayUrl,
  green: bannerGreenUrl,
  lightBlue: bannerLightBlueUrl,
  lightBrown: bannerLightBrownUrl,
  orange: bannerOrangeUrl,
  purple: bannerPurpleUrl,
  red: bannerRedUrl,
  white: bannerWhiteUrl,
} as const;

export type AssetKey = keyof typeof assets;
export type IconKey = keyof typeof icons;
export type SpriteKey = keyof typeof sprites;
export type SfxKey = keyof typeof sfx;
export type PlanetKey = keyof typeof planets;
export type FactionBannerKey = keyof typeof factionBanners;
