# LOOP PET

An English-language pixel focus game with an earless mole: create a pet, focus while it digs, collect items, stack equipment, and review local study time.

[中文](../README.md) · [Product specification (Chinese)](PRODUCT.md) · [Architecture (Chinese)](ARCHITECTURE.md) · [Testing (Chinese)](TESTING.md)

![Pet setup](images/setup.png)

## Download and play

On the GitHub repository page, use **Code → Download ZIP**. Extract the archive, then open **`dist/LOOP_PET.html`** in Chrome or Edge. It contains every script and style; no build tools or runtime packages are required.

Clicking an HTML file on GitHub displays its source. That is not a playable game preview. Download and extract it, or run a local server from the repository root:

```sh
python3 -m http.server 8000
```

On Windows, `py -m http.server 8000` is also available when the Python launcher is installed. Open `http://localhost:8000/` in your browser.

## Features

- Name a pet and choose from 12 presets or a custom body color.
- Focus timer with Study / Work / Break, pause/resume/end, and a 15-second demo.
- Real pixel-terrain excavation and a camera that follows the shaft underground.
- Idle blinking and targeted petting: a jump, a synthesized chirp, and `yeeeeee`. Petting is disabled during running and paused sessions.
- Four discoveries, star rewards, and four simultaneously wearable accessories.
- Actual Study time today/week/all time, 7/30-day charts, a calendar, and daily logs. Midnight-crossing sessions are split by device-local date.
- Morning/day/evening/night scenery driven by the device's clock and timezone.
- Four clearly labeled **sample** companions: Luka, Yun, Daniel, and Selina, with distinct colors, progress bars and expandable inventories.
- Locally generated stereo rain, saved volume, and no audio autoplay.

The companion screen is not connected to real players. There are no accounts, backend, or cloud sync. Progress is stored in this browser's `localStorage`; restricted previews may only retain in-memory state.

## Build

Edit the source files at repository root, then regenerate the tracked standalone version:

```sh
python3 scripts/build_standalone.py
```

Output: `dist/LOOP_PET.html`.

## Test

Python 3.10+ is recommended. In a virtual environment:

```sh
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/test_entry.py
python tests/test_site.py
python tests/test_world.py
```

Tests reuse a system `chromium`/`chromium-browser` when present, fall back to Playwright's browser, or use `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when set. On Linux, Playwright's `install --with-deps chromium` can install missing browser libraries.

The entry regression reproduces previews that allow JavaScript but prohibit form submission. START and Enter render the destination directly, independent of form or history permissions. All views share the earless sprite.

## Deployment

The site can run on GitHub Pages from the `main` branch and repository root. An owner must enable it in **Settings → Pages** and use the deployment URL shown there. A code push alone does not establish a working public site. See [deployment instructions (Chinese)](DEPLOYMENT.md).

![Game](images/focus.png)
