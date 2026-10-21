#!/usr/bin/env python3
"""Embed the local scripts and CSS into a reproducible, offline HTML file."""
from pathlib import Path
import argparse
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ('world.js', 'journey.js', 'home.js', 'audio.js', 'pixel-art.js', 'app.js')


def build(output: Path) -> Path:
    page = (ROOT / 'index.html').read_text(encoding='utf-8')
    style_tag = '<link rel="stylesheet" href="style.css">'
    if page.count(style_tag) != 1:
        raise ValueError('Expected exactly one local style.css stylesheet tag')
    css = (ROOT / 'style.css').read_text(encoding='utf-8')
    page = page.replace(style_tag, '<style>\n' + css + '\n</style>')
    audio_path = 'assets/audio/warm-focus.mp3'
    audio_data = base64.b64encode((ROOT / audio_path).read_bytes()).decode('ascii')
    if page.count('src="' + audio_path + '"') != 1:
        raise ValueError('Expected one local Warm Focus audio source')
    page = page.replace('src="' + audio_path + '"', 'src="data:audio/mpeg;base64,' + audio_data + '"')
    for name in SCRIPTS:
        tag = f'<script src="{name}"></script>'
        if page.count(tag) != 1:
            raise ValueError(f'Expected exactly one script tag for {name}')
        code = (ROOT / name).read_text(encoding='utf-8')
        # Keep inline script delimiters safe if a future string contains HTML.
        code = re.sub(r'</script', lambda m: '<\\/script', code, flags=re.IGNORECASE)
        page = page.replace(tag, '<script>\n' + code + '\n</script>')
    if re.search(r'<script\b[^>]*\bsrc=', page, re.IGNORECASE):
        raise ValueError('The standalone build still references an external script')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding='utf-8')
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist' / 'LOOP_PET.html')
    args = parser.parse_args()
    output = build(args.output)
    print(f'Built {output} ({output.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
