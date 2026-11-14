# Interface fonts

- `pixelify-sans.ttf`: Pixelify Sans, licensed under the SIL Open Font License in `OFL.txt`. Retained for the startup screen's VG credit.
- `silver.ttf`: Silver Medium, version 1.0, copyright 2019 Poppy Works; designers Itou Hiro, Yoon Design and Wolfgang Wozniak. Supplied by the project owner and preserved byte-for-byte with its original metadata. `silver.woff` is a lossless web-font packaging of those same glyphs. The Pixelify Sans and supplement licenses do not cover Silver.
- `silver-complement.woff`: Eumo Silver Complement, a renamed OFL-1.1 derivative of Fusion Pixel 12px Proportional zh-Hans 2026.11.10. It contains only characters missing from the supplied Silver file. Source pixels remain 100 font units square, CJK advances remain 1200 units, and the baseline is moved up by 100 units to align with Silver. The em and vertical metrics match Silver. Three additional pixel symbols (minus, check and four-point star) are original Eumo drawings released under OFL-1.1.

The interface tries Silver first, then its pixel supplement. Both have the same CSS size and metric adjustments so existing and added glyphs share the same pixel scale. The current Chinese interface's 711 distinct Han characters are all covered; the supplement provides 17,520 additional characters across CJK, Latin extensions, punctuation and symbols. This is not a claim to cover every Unicode character. System fonts remain a last resort for characters outside both fonts.

Startup artwork and the VG credit retain their original appearance. Both WOFF files and the notices are included in desktop and offline builds.

## Supplement source and rebuilding

- Source release: https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.11.10
- Archive: `fusion-pixel-font-12px-proportional-ttf-v2026.11.10.zip`
- Archive SHA-256: `aa6b4da3f80d95af45f41d74b37db0fa3a832d7f428adeb7234b4758d50bbae9`
- Extracted input: `fusion-pixel-12px-proportional-zh_hans.ttf`
- Input SHA-256: `7e93fedda2c55bb37badb2262aaf43b08e3cb5976a0e3de2d90986ce59fe902e`

Run `python scripts/build_silver_complement.py --fusion /path/to/fusion-pixel-12px-proportional-zh_hans.ttf` with FontTools installed. `--ttf-output /path/to/output.ttf` also writes an uncompressed copy of the supplement. Regular application builds use the committed fonts and do not download anything.

Upstream notices are retained in `licenses/fusion-pixel-OFL.txt`, `licenses/ark-pixel-OFL.txt`, `licenses/cubic-11-OFL.txt` and `licenses/galmuri-OFL.txt`. The supplement remains under the SIL Open Font License 1.1. The application and Silver itself do not become OFL-licensed by using it.
