#!/usr/bin/env python3
"""
Derive the shipped brand marks from the master art.

    private/brand-icons/<Display Name>.png   1024px RGBA masters
    public/brands/<brand-id>.png             384px, quantised, what ships

THE MASTERS ARE NOT IN GIT. private/ is gitignored, so the repo tracks exactly
one copy of each mark — the derived one — and nothing is duplicated between a
source folder and an output folder in version control. The trade is that a
fresh clone cannot rebuild the marks: the 1024px originals live in the art
library, and this folder is the working copy. If you need to change a mark,
put the new master here and re-run; if this folder is empty, fetch the
originals before you do.

Why derive at all rather than serving the masters directly:

  · public/ ships VERBATIM. The masters total 2.9 MB and the site never renders
    a mark larger than 112 CSS px, so serving them would cost 2.9 MB of
    download to display 382 KB of pixels.
  · The filename becomes the URL. Masters are named for humans
    ("Benobasa's Fist.png"); the web needs `benobasas-fist.png` — no percent
    encoding for spaces and apostrophes, which is the kind of path that works
    on one host and 404s on another. SLUGS maps the two, and that map is also
    the record of which master belongs to which brand id.
  · The marks are flat colour over a halftone field — a few dozen distinct
    colours, no photographic gradient. A quantised PNG beats WebP by 3x here
    (22 KB vs 62 KB at matched quality). Do not "modernise" this to WebP
    without measuring; the measurement is the reason.

  · UNREVEALED ART NEVER GOES IN public/. Marks for brands that have not been
    announced stay in private/brand-icons-unrevealed/ and out of SLUGS. Adding
    one here publishes it the moment the site builds. See .gitignore.

SIZE is 384, not 256, because the masters are not in git to re-derive from.
384 is visually indistinguishable from the master at 112 CSS px on a 3x
display; 256 softens the halftone and fringes the linework there. The extra
144 KB buys headroom that cannot be recovered later.

Alpha is trimmed to the mark's own bounding box before resizing, so every
badge fills its box identically. Several marks are deliberately NOT circular
(Mega Byte's bite, Zodiac Reliquary's gate) — never clip these to a circle
in CSS.

Run: python3 scripts/brand-icons.py    (needs Pillow; not a site dependency)
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MASTERS = ROOT / "private" / "brand-icons"
OUT = ROOT / "public" / "brands"

SIZE = 384
COLOURS = 64
# LuX's ring is a full-spectrum gradient and bands badly at 64.
COLOURS_BY_SLUG = {"lux-brand": 160}

# master display name -> brand id in src/data/universe.ts
SLUGS = {
    # Monarchy of Boom
    "Scrap Brigade": "scrap-brigade",
    "Benobasa's Fist": "benobasas-fist",
    "Chaos Verve": "chaos-verve",
    "Mega Byte": "mega-byte",
    # Hana Mori
    "Bloom and Never": "bloom-and-never",
    "Ark Totem": "ark-totem",
    "Feralesque": "feralesque",
    "De-Crypt": "de-crypt",
    # Celestial Shogunate
    "Infinite Divine": "infinite-divine",
    "Onryoki Noh": "onryoki-noh",
    "Zodiac Reliquary": "zodiac-reliquary",
    "Forbidden Archives": "forbidden-archives",
    # Subnet 86
    "Data Nation": "data-nation",
    "Hostile Rewrite": "hostile-rewrite",
    "Endless Chain": "endless-chain",
    "Masquerade": "masquerade",
    # Personal
    "Lux": "lux-brand",
}


def build() -> None:
    if not MASTERS.is_dir():
        raise SystemExit(
            f"no masters at {MASTERS}\n"
            "They are deliberately not in git — fetch them from the art library first."
        )

    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, slug in sorted(SLUGS.items()):
        master = MASTERS / f"{name}.png"
        if not master.exists():
            raise SystemExit(f"missing master: {master}")

        art = Image.open(master).convert("RGBA")
        art = art.crop(art.split()[3].getbbox())

        width, height = art.size
        side = max(width, height)
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        square.paste(art, ((side - width) // 2, (side - height) // 2))

        square.resize((SIZE, SIZE), Image.LANCZOS).quantize(
            colors=COLOURS_BY_SLUG.get(slug, COLOURS), method=Image.FASTOCTREE
        ).save(OUT / f"{slug}.png", "PNG", optimize=True)

        size = (OUT / f"{slug}.png").stat().st_size
        total += size
        print(f"{slug:<20} {size // 1024:>3} KB")

    print(f"{'TOTAL':<20} {total // 1024:>3} KB  ({len(SLUGS)} marks)")


if __name__ == "__main__":
    build()
