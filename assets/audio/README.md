# Music files

`warm-focus-3.mp3` is the user-supplied **Warm Focus (3).mp3**, unchanged. Duration: approximately **194.520 seconds**. The two-syllable pet sound is synthesized separately in `audio.js`.

The music room is organized through [`music-catalog.js`](../../music-catalog.js): Soft music, Groove and White noise. Only Warm Focus currently has an audio file. Reserved tracks have `src: null` and show Coming soon; no replacement sounds are generated or fetched.

For a future track, place the file here and change the matching catalog entry's title/category/src. Run `python scripts/build_standalone.py` afterward: every declared local track is embedded automatically, and missing files fail the build. The default track is shared with the audio element rather than duplicated in the download. See [the music guide](../../docs/MUSIC.md).

Playback begins only after the user requests it. One audio element continues across navigation; volume, track and repeat preference persist, but playback does not automatically restart after reload. The sidebar and full player control the same element.
