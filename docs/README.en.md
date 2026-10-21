# LOOP PET

An English pixel focus companion. Study or work while an earless mole digs, automatically collects stars and finds, and brings discoveries home.

[中文 README](../README.md) · [Product details (Chinese)](PRODUCT.md)

## Download and run

Download the repository ZIP from GitHub, extract it, and open **dist/LOOP_PET.html** in Chrome or Edge. The single file embeds all artwork, scripts, styles, and the creator-supplied Warm Focus MP3. No installation is required to play.

GitHub displays HTML source when browsing a file; download and open it locally, or enable GitHub Pages separately. No public deployment is claimed here.

## Features and rules

- Name and recolor your mole with 12 presets or a custom color; returning players go directly to Focus.
- Study and Work: 1 star per 5 active minutes, 1 find per 10 minutes, 1 metre per 30 seconds. Unused time carries across sessions. Pauses and Breaks do not earn rewards.
- Pickups sit on the tool's actual route. Ending early keeps recorded time, depth and collected rewards. No daily cap or continuous-session multiplier.
- The repeatable 15-second developer demo still earns **1 spendable star, 5 metres and 1 find**. It does not enter focus reports.
- Home is the second navigation icon: four placement spots, furniture and room themes, including decorations made from your finds.
- Idle blinking, drowsiness after about 90 seconds, sleep after about 5 minutes; pet to wake, jump, say `yeeeeee` and play two louder doo-doo notes. No petting during sessions.
- Warm Focus music plays only after pressing Music, loops across navigation, remembers volume and does not autoplay on reload.
- Optional task and outcome notes; Study/Work totals, trend, calendar, daily closing and JSON export in the top-right Today page.
- Multiple equipment items can be worn together. Device-local daylight changes the world. Companions are four clearly labelled sample profiles, not live players.

All progress is browser-local. No account, cloud sync, real multiplayer, or attention verification is implemented.

## Development

```sh
python3 -m http.server 8000
python3 scripts/build_standalone.py
```

The application has no runtime package dependencies. Browser checks require Python, Playwright and Chromium; optional reward invariants use Node.js. See [testing](TESTING.md) and [validation](VALIDATION.md).

![Home](images/home.png)
