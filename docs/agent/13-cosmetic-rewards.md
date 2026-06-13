# 13 — Cosmetic Rewards & the Hangar

Source-backed grounding: `03-gamification-multiplayer.md` (extrinsic rewards
should celebrate learning behavior, never become pay-to-win or stigmatizing) and
`02-adaptivity-personalization.md` (give learners autonomy and a sense of
ownership). This doc explains the cosmetic-reward layer added on top of XP,
stars, and badges.

## Intent

Give learners a reason to return and a way to make their cockpit *theirs* —
especially as the trophy for beating a zone — without ever altering the math or
the difficulty. Every cosmetic is **purely visual**. Equipping a ship, laser, or
theme changes appearance only; it never touches hit detection, scoring, hearts,
adaptivity, or unlock gating of levels.

## What can be earned

Three families, all in `src/game/campaign/cosmetics.ts`:

- **Ship hulls** — each is its own distinct pixel-art sprite (the finale, the
  Golden Phantom, is a boss-class hull). Sprites live in `src/assets/ships/`
  (keyed by `shipSprites` in `assetMap.ts`) and were pixelized from the
  space-shooter kit via `scripts/import_ship_sprites.py`. A per-skin `hue` can
  still tint a sprite if a future variant wants it.
- **Laser styles** — the firing beam color/width and the projectile bolt hue.
- **Cockpit themes** — the board background plus the app accent palette
  (overrides CSS custom properties: `--cyan`, `--amber`, `--space-0/1`).

The catalog is declarative data. Each item carries an `UnlockRule` so locked
cards can render a precise "how to unlock" hint.

## How they unlock

Unlocks reward learning behavior, never grinding/speed/tool use:

- `zone` — clearing every level of a zone. **Every zone (1–9) grants exactly one
  reward**, so finishing a planet always pays off.
- `xp` — banking a lifetime-XP threshold.
- `stars` — collecting a number of mastery stars.
- `badge` — earning a specific badge.
- `default` — always available (the starter ship/laser/theme).

Evaluation is pure (`evaluateNewUnlocks` over an `UnlockContext`). It runs:

1. In `useCampaignProgress.markComplete`, so a completion can announce fresh
   unlocks in the victory overlay (`CompletionRewards.newCosmetics`).
2. In the `useCampaignProgress` state initializer, to **backfill** players who
   earned the prerequisites before this feature shipped.
3. On Arcade XP gains (which bypass `markComplete`).

Earned items persist in `slope-invaders:unlocks` (id → epoch ms) and, like
badges, are never revoked.

## Where they show up

- **Victory overlay** announces newly unlocked items (alongside XP and badges).
- **The Hangar** (`src/app/HangarScreen.tsx`) is the dedicated bay to browse and
  equip. It is opened from the menu top bar and the Pilot Profile. Locked items
  appear with their unlock hint; owned items can be equipped; the current
  loadout previews at the top.
- **Pilot Profile** shows an unlock count and an "Open Hangar" entry.

## Equipping

The equipped selection lives in `slope-invaders:loadout` via `useLoadout`
(`{ ship, laser, theme }` ids, validated against the catalog with the default
substituted for any unknown id). `App` threads the resolved ship/laser into
`Game → GameBoard` and applies the theme's palette to `:root`. Ship/bolt tinting
uses Konva's HSV filter (the node is cached so the filter runs); the Hangar
previews use CSS `hue-rotate`.

## Rules for future agents

- Keep cosmetics purely visual. Never let an equipped item change gameplay,
  scoring, adaptivity, or what content is available.
- Never gate a cosmetic on speed, grinding, calculator/tweak use, or anything
  stigmatizing. Tie unlocks to demonstrated learning (zones, stars, XP, badges).
- Add new items by appending to the catalog in `cosmetics.ts`; keep ids stable
  (they are persisted). Update `cosmetics.test.ts` for new unlock logic.
- New ship art: add the source to `scripts/import_ship_sprites.py`, regenerate
  the 128×128 pixel-art PNG into `src/assets/ships/`, register it in
  `shipSprites`, and record provenance in `docs/ASSET_SOURCES.md`. Keep committed
  sprites small; never commit the raw kit.
