#!/usr/bin/env python3
"""Batch-pixelize UI artwork without changing its canvas dimensions.

The script downsamples each image, reduces its color palette, and scales it back
with nearest-neighbor sampling. By default it writes a preview tree under
tmp/pixelized-ui and never modifies production assets.
"""

from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print(
        "Pillow is required. Install it with:\n"
        "  python3 -m pip install -r scripts/requirements-pixelize.txt",
        file=sys.stderr,
    )
    raise SystemExit(2)


SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


@dataclass(frozen=True)
class PixelPreset:
    block_size: int
    colors: int


PRESETS = {
    "backgrounds": PixelPreset(block_size=5, colors=32),
    "buttons": PixelPreset(block_size=5, colors=24),
    "coach": PixelPreset(block_size=3, colors=24),
    "hud": PixelPreset(block_size=3, colors=24),
    "panels": PixelPreset(block_size=4, colors=32),
    "results": PixelPreset(block_size=4, colors=32),
    # Hero artwork needs a much coarser source grid to read as a sprite once it
    # is scaled down in the responsive menu.
    "ships": PixelPreset(block_size=12, colors=20),
}
DEFAULT_PRESET = PixelPreset(block_size=4, colors=32)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pixelize PNG, JPEG, and WebP artwork in a file or directory.",
    )
    parser.add_argument(
        "input",
        nargs="?",
        type=Path,
        default=Path("src/assets/ui"),
        help="Input image or directory (default: src/assets/ui).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("tmp/pixelized-ui"),
        help="Preview output directory (default: tmp/pixelized-ui).",
    )
    parser.add_argument(
        "--in-place",
        action="store_true",
        help="Replace source files atomically. Use only after reviewing previews.",
    )
    parser.add_argument(
        "--backup",
        type=Path,
        help="When using --in-place, copy originals to this directory first.",
    )
    parser.add_argument(
        "--block-size",
        type=int,
        help="Override category presets. Larger values produce chunkier pixels.",
    )
    parser.add_argument(
        "--colors",
        type=int,
        help="Override category palette size (2-256).",
    )
    parser.add_argument(
        "--alpha-levels",
        type=int,
        default=4,
        help="Transparency levels for pixel-shaped edges (default: 4).",
    )
    parser.add_argument(
        "--dither",
        action="store_true",
        help="Use Floyd-Steinberg dithering during palette reduction.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned operations without writing files.",
    )
    return parser.parse_args()


def validate_args(args: argparse.Namespace) -> None:
    if not args.input.exists():
        raise SystemExit(f"Input does not exist: {args.input}")
    if args.block_size is not None and args.block_size < 1:
        raise SystemExit("--block-size must be at least 1")
    if args.colors is not None and not 2 <= args.colors <= 256:
        raise SystemExit("--colors must be between 2 and 256")
    if not 2 <= args.alpha_levels <= 256:
        raise SystemExit("--alpha-levels must be between 2 and 256")
    if args.backup and not args.in_place:
        raise SystemExit("--backup is only valid with --in-place")


def image_paths(input_path: Path) -> list[Path]:
    if input_path.is_file():
        return [input_path] if input_path.suffix.lower() in SUPPORTED_EXTENSIONS else []
    return sorted(
        path
        for path in input_path.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    )


def relative_path(path: Path, input_path: Path) -> Path:
    return Path(path.name) if input_path.is_file() else path.relative_to(input_path)


def preset_for(source: Path, relative: Path, args: argparse.Namespace) -> PixelPreset:
    category = relative.parts[0] if len(relative.parts) > 1 else source.parent.name
    preset = PRESETS.get(category, DEFAULT_PRESET)
    return PixelPreset(
        block_size=args.block_size or preset.block_size,
        colors=args.colors or preset.colors,
    )


def quantize_alpha(alpha: Image.Image, levels: int) -> Image.Image:
    step = 255 / (levels - 1)
    return alpha.point(lambda value: int(round(value / step) * step))


def pixelize(
    source: Path,
    destination: Path,
    preset: PixelPreset,
    alpha_levels: int,
    dither: bool,
) -> None:
    with Image.open(source) as opened:
        original_format = opened.format
        has_alpha = "A" in opened.getbands() or "transparency" in opened.info
        image = opened.convert("RGBA" if has_alpha else "RGB")
        original_size = image.size
        reduced_size = (
            max(1, round(original_size[0] / preset.block_size)),
            max(1, round(original_size[1] / preset.block_size)),
        )

        reduced = image.resize(reduced_size, Image.Resampling.BOX)
        rgb = reduced.convert("RGB")
        palette = rgb.quantize(
            colors=preset.colors,
            method=Image.Quantize.MEDIANCUT,
            dither=Image.Dither.FLOYDSTEINBERG if dither else Image.Dither.NONE,
        ).convert("RGB")

        if has_alpha:
            alpha = quantize_alpha(reduced.getchannel("A"), alpha_levels)
            palette = palette.convert("RGBA")
            palette.putalpha(alpha)

        result = palette.resize(original_size, Image.Resampling.NEAREST)
        destination.parent.mkdir(parents=True, exist_ok=True)

        save_options: dict[str, object] = {}
        suffix = destination.suffix.lower()
        if suffix == ".webp":
            save_options.update(lossless=True, method=6)
        elif suffix in {".jpg", ".jpeg"}:
            result = result.convert("RGB")
            save_options.update(quality=95, subsampling=0)
        elif suffix == ".png":
            save_options.update(optimize=True)

        result.save(destination, format=original_format, **save_options)


def write_in_place(
    source: Path,
    relative: Path,
    preset: PixelPreset,
    args: argparse.Namespace,
) -> None:
    if args.backup:
        backup_path = args.backup / relative
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, backup_path)

    with tempfile.NamedTemporaryFile(
        prefix=f".{source.stem}-",
        suffix=source.suffix,
        dir=source.parent,
        delete=False,
    ) as temporary:
        temporary_path = Path(temporary.name)

    try:
        pixelize(source, temporary_path, preset, args.alpha_levels, args.dither)
        temporary_path.replace(source)
    finally:
        temporary_path.unlink(missing_ok=True)


def main() -> int:
    args = parse_args()
    validate_args(args)
    sources = image_paths(args.input)
    if not sources:
        print(f"No supported images found under {args.input}", file=sys.stderr)
        return 1

    for source in sources:
        relative = relative_path(source, args.input)
        preset = preset_for(source, relative, args)
        destination = source if args.in_place else args.output / relative
        action = "replace" if args.in_place else "preview"
        print(
            f"{action:7} {relative} "
            f"(block={preset.block_size}, colors={preset.colors})"
        )

        if args.dry_run:
            continue
        if args.in_place:
            write_in_place(source, relative, preset, args)
        else:
            pixelize(
                source,
                destination,
                preset,
                args.alpha_levels,
                args.dither,
            )

    print(f"Processed {len(sources)} image(s).")
    if not args.in_place:
        print(f"Preview written to: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
