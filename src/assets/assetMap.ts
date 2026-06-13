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

// Cosmetic ship hulls (pixelized from the space-shooter kit; see
// scripts/import_ship_sprites.py and docs/ASSET_SOURCES.md).
import shipCrimsonUrl from './ships/crimson.png';
import shipAzureUrl from './ships/azure.png';
import shipNebulaUrl from './ships/nebula.png';
import shipPhantomUrl from './ships/phantom.png';
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
import planetStormUrl from './planets/storm-planet.png';
import planetLavaCastleUrl from './planets/lavacastle-planet.png';
import planetClockworkUrl from './planets/clockwork-planet.png';
import planetCyberpunkUrl from './planets/cyberpunk-planet.png';
import planetRobotFactoryUrl from './planets/robotfactory-planet.png';
import planetUnderworldUrl from './planets/underworld-planet.png';

// Pixelized achievement emblems curated from the Sci-Fi Skill Icons pack.
import achievementPerfectTrajectoryUrl from './achievements/perfect-trajectory.png';
import achievementComboPilotUrl from './achievements/combo-pilot.png';
import achievementNoPreviewPilotUrl from './achievements/no-preview-pilot.png';
import achievementComebackCadetUrl from './achievements/comeback-cadet.png';
import achievementGrowthStreakUrl from './achievements/growth-streak.png';

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

// Curated tactical UI kit. Source files live outside the app repository; only
// optimized production assets are committed under src/assets/ui/.
import uiMenuBackgroundUrl from './ui/backgrounds/menu-space.webp';
import uiCockpitBackgroundUrl from './ui/backgrounds/cockpit-space.webp';

import uiButtonBackwardUrl from './ui/buttons/backward.png';
import uiButtonBackwardActiveUrl from './ui/buttons/backward-active.png';
import uiButtonForwardUrl from './ui/buttons/forward.png';
import uiButtonForwardActiveUrl from './ui/buttons/forward-active.png';
import uiButtonPlayUrl from './ui/buttons/play.png';
import uiButtonPlayActiveUrl from './ui/buttons/play-active.png';
import uiButtonReplayUrl from './ui/buttons/replay.png';
import uiButtonReplayActiveUrl from './ui/buttons/replay-active.png';
import uiButtonSettingsUrl from './ui/buttons/settings.png';
import uiButtonSettingsActiveUrl from './ui/buttons/settings-active.png';
import uiButtonInfoUrl from './ui/buttons/info.png';
import uiButtonInfoActiveUrl from './ui/buttons/info-active.png';
import uiButtonProfileUrl from './ui/buttons/profile.png';
import uiButtonProfileActiveUrl from './ui/buttons/profile-active.png';
import uiButtonListUrl from './ui/buttons/menu.png';
import uiButtonListActiveUrl from './ui/buttons/menu-active.png';
import uiButtonPlanetUrl from './ui/buttons/planet.png';
import uiButtonPlanetActiveUrl from './ui/buttons/planet-active.png';
import uiButtonCloseUrl from './ui/buttons/close.png';
import uiButtonCloseActiveUrl from './ui/buttons/close-active.png';
import uiButtonConfirmUrl from './ui/buttons/ok.png';
import uiButtonConfirmActiveUrl from './ui/buttons/ok-active.png';
import uiButtonTrophyUrl from './ui/buttons/rating.png';
import uiButtonTrophyActiveUrl from './ui/buttons/rating-active.png';
import uiButtonHangarUrl from './ui/buttons/hangar.png';
import uiButtonHangarActiveUrl from './ui/buttons/hangar-active.png';

import uiCoachDialogUrl from './ui/panels/coach-dialog.png';
import uiSettingsFrameUrl from './ui/panels/settings-frame.png';
import uiStatsRailUrl from './ui/hud/stats-rail.png';
import uiHealthRailUrl from './ui/hud/health-rail.png';
import uiMissionControlUrl from './ui/coach/mission-control.webp';
import uiVictoryControlUrl from './ui/coach/victory-control.webp';
import uiMasteryStarUrl from './ui/results/mastery-star.png';
import uiVictoryFrameUrl from './ui/results/victory-frame.png';
import uiDefeatFrameUrl from './ui/results/defeat-frame.png';
import uiHeroShipUrl from './ui/ships/hero-ship.webp';

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
  storm: planetStormUrl,
  lavacastle: planetLavaCastleUrl,
  clockwork: planetClockworkUrl,
  cyberpunk: planetCyberpunkUrl,
  robotfactory: planetRobotFactoryUrl,
  underworld: planetUnderworldUrl,
} as const;

/** Unique pixel-art emblems for non-zone achievements. */
export const achievementIcons = {
  perfectTrajectory: achievementPerfectTrajectoryUrl,
  comboPilot: achievementComboPilotUrl,
  noPreviewPilot: achievementNoPreviewPilotUrl,
  comebackCadet: achievementComebackCadetUrl,
  growthStreak: achievementGrowthStreakUrl,
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

/** Full-screen imagery for the tactical arcade shell. */
export const uiBackgrounds = {
  menu: uiMenuBackgroundUrl,
  cockpit: uiCockpitBackgroundUrl,
} as const;

/** Paired normal/active artwork for every asset-backed UI command. */
export const uiButtons = {
  back: { default: uiButtonBackwardUrl, active: uiButtonBackwardActiveUrl },
  forward: { default: uiButtonForwardUrl, active: uiButtonForwardActiveUrl },
  play: { default: uiButtonPlayUrl, active: uiButtonPlayActiveUrl },
  replay: { default: uiButtonReplayUrl, active: uiButtonReplayActiveUrl },
  settings: { default: uiButtonSettingsUrl, active: uiButtonSettingsActiveUrl },
  info: { default: uiButtonInfoUrl, active: uiButtonInfoActiveUrl },
  profile: { default: uiButtonProfileUrl, active: uiButtonProfileActiveUrl },
  list: { default: uiButtonListUrl, active: uiButtonListActiveUrl },
  planet: { default: uiButtonPlanetUrl, active: uiButtonPlanetActiveUrl },
  close: { default: uiButtonCloseUrl, active: uiButtonCloseActiveUrl },
  confirm: { default: uiButtonConfirmUrl, active: uiButtonConfirmActiveUrl },
  trophy: { default: uiButtonTrophyUrl, active: uiButtonTrophyActiveUrl },
  hangar: { default: uiButtonHangarUrl, active: uiButtonHangarActiveUrl },
} as const;

/** Decorative frames used behind responsive HTML content. */
export const uiPanels = {
  coachDialog: uiCoachDialogUrl,
  settingsFrame: uiSettingsFrameUrl,
} as const;

/** Compact tactical HUD rails. */
export const uiHud = {
  statsRail: uiStatsRailUrl,
  healthRail: uiHealthRailUrl,
} as const;

/** Mission-control character artwork. */
export const uiCoach = {
  missionControl: uiMissionControlUrl,
  victoryControl: uiVictoryControlUrl,
} as const;

/** Result-screen frames and mastery imagery. */
export const uiResults = {
  masteryStar: uiMasteryStarUrl,
  victoryFrame: uiVictoryFrameUrl,
  defeatFrame: uiDefeatFrameUrl,
} as const;

/** Large decorative ships used outside the coordinate board. */
export const uiShips = {
  hero: uiHeroShipUrl,
} as const;

/**
 * Cosmetic ship-hull sprites, keyed by the id the cosmetics catalog references.
 * Each is a 128×128 transparent pixel-art sprite facing "up" (top-down), so the
 * board's square Ship sprite keeps its aspect ratio.
 */
export const shipSprites = {
  scout: shipUrl,
  falcon: shipArrowUrl,
  crimson: shipCrimsonUrl,
  azure: shipAzureUrl,
  nebula: shipNebulaUrl,
  phantom: shipPhantomUrl,
} as const;

export type ShipSpriteKey = keyof typeof shipSprites;

export type AssetKey = keyof typeof assets;
export type IconKey = keyof typeof icons;
export type SpriteKey = keyof typeof sprites;
export type SfxKey = keyof typeof sfx;
export type PlanetKey = keyof typeof planets;
export type AchievementIconKey = keyof typeof achievementIcons;
export type FactionBannerKey = keyof typeof factionBanners;
export type UiButtonKey = keyof typeof uiButtons;
export type UiPanelKey = keyof typeof uiPanels;
