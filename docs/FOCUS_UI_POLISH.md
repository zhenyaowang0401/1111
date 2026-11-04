# Focus UI polish

Visual-only pass, based on UI UX Pro Max's existing-app consistency guidance and
Emil Kowalski's restrained feedback and motion guidance. No application JavaScript,
routes, gameplay rules, saved data, timer, audio or friendship behavior changed.

- Mine frame stays dominant; timer panel and inline chat use quieter borders.
- Existing selected session mode has a stronger underline; main button label reserves width.
- Existing controls receive 100–120 ms color/press feedback using integer-pixel offsets.
- Language menu enters over 160 ms; native music dialog enters over 180 ms.
  Closing is immediate, with existing Escape/focus behavior preserved.
- Reduced-motion preferences disable menu/dialog animation, including the backdrop.
- Existing responsive geometry, pixel canvases and UI text retained.

Validation:
- `python tests/test_viewport.py`: 13 desktop viewport/DPI combinations, idle/running/paused,
  mobile and offline layout passed.
- `python tests/test_locale.py`: bilingual UI, keyboard menus, offline and floating window passed.
- Browser spot-check: rendered mine, start/pause, repeated music open/Escape with focus
  return, actual white-noise playback without resuming timer, reduced-motion menus.
- `python tests/test_music.py`: offline fixture now marks the unrelated onboarding tour seen,
  matching its music-only scope. Transport, categories, seek/volume/repeat, keyboard/mobile,
  failure/retry, uninterrupted timer, and offline playback all passed.
- `python scripts/build_standalone.py`: rebuilt all three standalone entry files.

Previews: `images/eumo-focus-polish.png`, `images/eumo-music-polish.png`,
`images/eumo-language-polish.png`.
