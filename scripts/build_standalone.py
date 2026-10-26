#!/usr/bin/env python3
"""Embed the local scripts and CSS into a reproducible, offline HTML file."""
from pathlib import Path
import argparse
import base64
import json
import mimetypes
import re

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ('world.js', 'journey.js', 'home.js', 'wardrobe.js', 'wardrobe-art.js', 'terrain.js', 'music-catalog.js', 'audio.js', 'pixel-art.js', 'chat.js', 'music.js', 'friends.js', 'app.js')


def embed_music() -> tuple[str, str]:
    """Embed every finished local track; empty slots never cause audio requests."""
    code = (ROOT / 'music-catalog.js').read_text(encoding='utf-8')
    prefix, suffix = ' const catalog = ', ';\n return catalog;'
    start = code.index(prefix) + len(prefix)
    end = code.index(suffix, start)
    catalog = json.loads(code[start:end])
    ids = [track['id'] for track in catalog['tracks']]
    if len(ids) != len(set(ids)):
        raise ValueError('Music track IDs must be unique')
    sources = {}
    for track in catalog['tracks']:
        source = track.get('src')
        if not source:
            continue
        path = (ROOT / source).resolve()
        if not path.is_relative_to((ROOT / 'assets/audio').resolve()):
            raise ValueError('Music files must be inside assets/audio: ' + source)
        if path.suffix.lower() not in ('.mp3', '.wav', '.ogg', '.m4a'):
            raise ValueError('Unsupported music file extension: ' + source)
        if source not in sources:
            mime = mimetypes.guess_type(path.name)[0] or 'audio/mpeg'
            sources[source] = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
        track['src'] = sources[source]
    default = next((t for t in catalog['tracks'] if t['id'] == catalog['defaultTrack'] and t.get('src')), None)
    if not default:
        raise ValueError('defaultTrack must refer to an available audio file')
    default_source = default['src']
    # Keep the default MP3 in the audio element once, rather than duplicating
    # several megabytes in the catalog as well. Other finished tracks live here.
    default['src'] = None
    embedded = code[:start] + json.dumps(catalog, ensure_ascii=False, separators=(',', ':')) + code[end:]
    embedded = embedded.replace(' return catalog;', " catalog.tracks.find(t=>t.id===catalog.defaultTrack).src=document.getElementById('focusMusic').getAttribute('src');\n return catalog;")
    return embedded, default_source


def build(output: Path) -> Path:
    page = (ROOT / 'index.html').read_text(encoding='utf-8')
    style_tag = '<link rel="stylesheet" href="style.css">'
    if page.count(style_tag) != 1:
        raise ValueError('Expected exactly one local style.css stylesheet tag')
    css = (ROOT / 'style.css').read_text(encoding='utf-8')
    font_path = 'assets/fonts/pixelify-sans.ttf'
    font_url = f'url("{font_path}")'
    if css.count(font_url) != 1:
        raise ValueError('Expected one local Pixelify Sans font source')
    font_data = base64.b64encode((ROOT / font_path).read_bytes()).decode('ascii')
    css = css.replace(font_url, f'url("data:font/ttf;base64,{font_data}")')
    # Preserve the font's redistribution license inside the downloadable file.
    css = '/*\n' + (ROOT / 'assets/fonts/OFL.txt').read_text(encoding='utf-8') + '\n*/\n' + css
    page = page.replace(style_tag, '<style>\n' + css + '\n</style>')
    catalog_code, default_source = embed_music()
    # The catalog is the single source for the starting track and all future files.
    page, count = re.subn(r'(<audio id="focusMusic" src=")[^"]+("[^>]*>)', lambda m: m[1] + default_source + m[2], page)
    if count != 1:
        raise ValueError('Expected one focusMusic audio element')
    for name in SCRIPTS:
        tag = f'<script src="{name}"></script>'
        if page.count(tag) != 1:
            raise ValueError(f'Expected exactly one script tag for {name}')
        code = catalog_code if name == 'music-catalog.js' else (ROOT / name).read_text(encoding='utf-8')
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
    parser.add_argument('--output', type=Path, default=ROOT / 'dist' / 'Eumo.html')
    args = parser.parse_args()
    output = build(args.output)
    # Keep the old filename current for players who replace their existing
    # local file. All three entry files contain exactly the same Eumo build.
    if output.resolve() == (ROOT / 'dist' / 'Eumo.html').resolve():
        for name in ['Supermo.html', 'LOOP_PET.html']:
            (ROOT / 'dist' / name).write_bytes(output.read_bytes())
    print(f'Built {output} ({output.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
