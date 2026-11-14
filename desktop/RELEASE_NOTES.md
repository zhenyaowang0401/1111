Eumo for Windows and macOS brings the web game's focus timer, mole companion, outfits, underground home, and reports to your desktop.

## What's new in 3.7.0

- A brief **EUMO** startup greeting pairs pixel lettering, flowers and mushrooms with the familiar daylight meadow. **VG** sits in the corner. It fades away in under a second, respects reduced motion, and never repeats when switching pages or opening the floating companion.
- Home now reserves room for its bottom controls when the window is resized. The selected wallpaper name sits beside the **Home** heading; the duplicate name/status row and **UNDERGROUND HOME** label are gone. Mobile homes scale to the screen, including the chest's click target.
- Music sliders now use pixel mushroom handles. The loop icon uses plain repeat arrows without a numeral; repeat-one and sequential playback continue to work as before.
- The mining frame has a slimmer upper edge without the extra name/number row. Depth keeps its number and unit, and the expanded conversation has a clean title bar. **Mole setup** moves to the setup header's upper-right corner.

Windows users on 3.3.0 or later can use Help → App updates to download this version and restart to install. Older Windows versions need one manual overwrite installation. Mac users can use the update check to download the matching DMG.

## Downloads

- **Windows 10 / 11 (x64):** `Eumo-Windows-x64-Setup.exe`
- **Mac with Apple silicon:** `Eumo-macOS-arm64.dmg`
- **Mac with Intel:** `Eumo-macOS-x64.dmg`
- **Web app:** https://1111-phi-ten.vercel.app

Mac ZIP builds are also available in the release assets.

## Floating companion

Float mole opens a native, draggable, always-on-top window with **no browser address bar**. It shares the main window's timer and rewards. Closing the main window while the mole is floating hides the main window and keeps the session running; use the return button to bring it back.

## Offline play and progress transfer

Local gameplay works offline. Chat, voice transcription, and friends require an internet connection. Web and desktop progress are stored separately; use **Help → Move / back up progress** to export and import a backup. Friend connections must be set up again on the new client. Chat history is not included in the backup.

## Installation notes

This release has no Windows publisher certificate or Apple Developer ID signature/notarization. macOS builds use ad-hoc signing only. Windows may show an unknown-publisher warning, and macOS may require confirmation in Privacy & Security before opening the app. Download from this repository's release page. `SHA256SUMS.txt` contains file checksums for verifying downloads.
