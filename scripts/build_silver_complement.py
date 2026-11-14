#!/usr/bin/env python3
"""Build Silver's matching pixel supplement from a pinned OFL source.

Download and extract fusion-pixel-12px-proportional-zh_hans.ttf from:
https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.11.10
Then run: python scripts/build_silver_complement.py --fusion /path/to/font.ttf

Requires FontTools. Runtime builds use the committed WOFF files and stay offline.
"""
import argparse
import hashlib
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / 'assets' / 'fonts'
SOURCE_SHA256 = '7e93fedda2c55bb37badb2262aaf43b08e3cb5976a0e3de2d90986ce59fe902e'
SOURCE_VERSION = '2026.11.10'

# Original drawings on Silver's 100-unit pixel grid. These interface symbols
# are absent from both Silver and the selected upstream supplement.
SYMBOLS = {
    '−': ['.........'] * 4 + ['.#######.'] + ['.........'] * 3,
    '✓': ['........#', '.......##', '......##.', '#....##..',
          '##..##...', '.####....', '..##.....'],
    '✦': ['....#....', '....#....', '...###...', '..#####..',
          '#########', '..#####..', '...###...', '....#....', '....#....'],
}


def pixel_glyph(rows):
    pen = TTGlyphPen(None)
    for y, row in enumerate(reversed(rows)):
        for x, cell in enumerate(row):
            if cell != '#':
                continue
            left, bottom = (x + 1) * 100, (y + 1) * 100
            pen.moveTo((left, bottom))
            pen.lineTo((left, bottom + 100))
            pen.lineTo((left + 100, bottom + 100))
            pen.lineTo((left + 100, bottom))
            pen.closePath()
    return pen.glyph()


def supported_block(cp):
    return (0x20 <= cp <= 0x9FFF or 0xF900 <= cp <= 0xFAFF
            or 0xFE10 <= cp <= 0xFFEF or 0x20000 <= cp <= 0x323AF)


def build(source, ttf_output=None):
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError('Unexpected Fusion Pixel source; use the pinned 2026.11.10 file.')
    silver = TTFont(FONTS / 'silver.ttf', recalcTimestamp=False)
    original = silver.getBestCmap()
    donor = TTFont(source, recalcTimestamp=False)
    donor_map = donor.getBestCmap()
    donor_set = donor.getGlyphSet()
    additions = sorted(cp for cp in donor_map if cp not in original and supported_block(cp))
    cmap = {cp: f'u{cp:04X}' for cp in additions}
    glyphs = {'.notdef': pixel_glyph(['#####', '#...#', '#...#', '#...#', '#####'])}
    metrics = {'.notdef': (700, 100)}
    for cp, name in cmap.items():
        source_name = donor_map[cp]
        recorded = DecomposingRecordingPen(donor_set)
        donor_set[source_name].draw(recorded)
        pen = TTGlyphPen(None)
        # Both fonts use 100-unit square pixels and 1200-unit CJK advances.
        # Fusion's bottom row is -100; Silver's is 0. Preserve the grid and
        # move the supplement up by one pixel, without stretching its strokes.
        recorded.replay(TransformPen(pen, (1, 0, 0, 1, 0, 100)))
        glyphs[name] = pen.glyph()
        metrics[name] = donor['hmtx'][source_name]
    for char, rows in SYMBOLS.items():
        if ord(char) in original:
            continue
        name = f'u{ord(char):04X}'
        cmap[ord(char)] = name
        glyphs[name] = pixel_glyph(rows)
        metrics[name] = (1100, 100)
    builder = FontBuilder(silver['head'].unitsPerEm, isTTF=True)
    builder.setupGlyphOrder(['.notdef'] + [cmap[cp] for cp in sorted(cmap)])
    builder.setupCharacterMap(cmap)
    builder.setupGlyf(glyphs)
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=silver['hhea'].ascent,
                                  descent=silver['hhea'].descent,
                                  lineGap=silver['hhea'].lineGap)
    builder.setupOS2(sTypoAscender=silver['OS/2'].sTypoAscender,
                    sTypoDescender=silver['OS/2'].sTypoDescender,
                    sTypoLineGap=silver['OS/2'].sTypoLineGap,
                    usWinAscent=silver['OS/2'].usWinAscent,
                    usWinDescent=silver['OS/2'].usWinDescent,
                    usWeightClass=400, fsType=0)
    builder.setupNameTable({
        'familyName': 'Eumo Silver Complement', 'styleName': 'Regular',
        'uniqueFontIdentifier': 'Eumo Silver Complement;1.0;' + SOURCE_VERSION,
        'fullName': 'Eumo Silver Complement Regular',
        'psName': 'EumoSilverComplement-Regular', 'version': 'Version 1.0',
        'copyright': 'Copyright (c) 2022, TakWolf (https://takwolf.com). '
                     'Metrics adaptation and additional symbols (c) 2026 Eumo contributors.',
        'licenseDescription': 'Licensed under the SIL Open Font License, Version 1.1. '
                              'Derived from Fusion Pixel Font 2026.11.10; '
                              'see the bundled upstream font licenses.',
        'licenseInfoURL': 'https://openfontlicense.org',
    })
    builder.setupPost()
    # Stable timestamps keep generated font assets reproducible.
    builder.font['head'].created = donor['head'].created
    builder.font['head'].modified = donor['head'].modified
    builder.font.recalcTimestamp = False
    if ttf_output:
        builder.save(ttf_output)
    builder.font.flavor = 'woff'
    builder.save(FONTS / 'silver-complement.woff')
    silver.flavor = 'woff'
    silver.save(FONTS / 'silver.woff')
    print(f'Built {len(cmap)} supplementary glyphs; original Silver glyphs stay unchanged.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fusion', type=Path, required=True)
    parser.add_argument('--ttf-output', type=Path)
    args = parser.parse_args()
    build(args.fusion, args.ttf_output)
