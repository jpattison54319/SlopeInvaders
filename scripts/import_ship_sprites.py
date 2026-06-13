#!/usr/bin/env python3
"""Import + pixelize cosmetic ship hulls from the space-shooter kit.

Each smooth-raster source ship is trimmed to its content, downsampled to a small
pixel grid (palette-reduced), upscaled nearest-neighbor, and centered on a
square transparent canvas so the in-game Ship sprite (drawn as a square) keeps
its aspect ratio. Run from the repo root; writes into src/assets/ships/.

    python3 scripts/import_ship_sprites.py

Sources live outside the repo (the kit is large and not committed); see
docs/ASSET_SOURCES.md for provenance. Only the optimized derivatives are
committed.
"""

from __future__ import annotations

from pathlib import Path
from PIL import Image

KIT = Path("../space-shooter-game-kit")
OUT = Path("src/assets/ships")

CANVAS = 128          # final square size
PIXEL_LONG = 52       # longest side of the chunky pixel grid
SPRITE_LONG = 112     # longest side after nearest-neighbor upscale (padding left)
COLORS = 32

# dest stem -> source ship in the kit
SHIPS = {
    "crimson": KIT / "Spaceship-2d-game-sprites/PNG/Ship_02/Ship_LVL_5.png",
    "azure": KIT / "Spaceship-2d-game-sprites/PNG/Ship_01/Ship_LVL_5.png",
    "nebula": KIT / "Boss-spaceship-game-sprites/PNG/Boss_02/Boss_Full.png",
    "phantom": KIT / "Boss-spaceship-game-sprites/PNG/Boss_03/Boss_Full.png",
}


def pixelize_ship(src: Path, dest: Path) -> None:
    with Image.open(src) as opened:
        img = opened.convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    w, h = img.size
    scale = PIXEL_LONG / max(w, h)
    small = (max(1, round(w * scale)), max(1, round(h * scale)))
    reduced = img.resize(small, Image.Resampling.BOX)

    # Palette-reduce the RGB, keep a quantized alpha for crisp pixel edges.
    rgb = reduced.convert("RGB").quantize(
        colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    ).convert("RGBA")
    alpha = reduced.getchannel("A").point(lambda v: 0 if v < 96 else 255)
    rgb.putalpha(alpha)

    up_scale = SPRITE_LONG / max(small)
    up = (round(small[0] * up_scale), round(small[1] * up_scale))
    sprite = rgb.resize(up, Image.Resampling.NEAREST)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(sprite, ((CANVAS - up[0]) // 2, (CANVAS - up[1]) // 2), sprite)
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest, format="PNG", optimize=True)
    print(f"wrote {dest} from {src.name}")


def main() -> int:
    for stem, src in SHIPS.items():
        if not src.exists():
            print(f"!! missing source: {src}")
            continue
        pixelize_ship(src, OUT / f"{stem}.png")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
