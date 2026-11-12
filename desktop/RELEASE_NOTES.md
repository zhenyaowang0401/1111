Eumo for Windows and macOS brings the web game's focus timer, mole companion, outfits, underground home, and reports to your desktop.

## What's new in 3.2.0

- Added a pixel microphone button inside both chat inputs on web, Windows, and macOS.
- Click to request microphone access and record; click again to turn up to 45 seconds of speech into an editable draft. Messages are sent only when you press Send.
- Added recording, cancellation, permission-denied, and transcription-error states. Cancelling or leaving the chat releases the microphone.
- Desktop permission requests are restricted to audio from Eumo's main window; macOS includes its system microphone permission description. Camera access remains blocked.

Voice transcription requires an internet connection and a configured speech provider on the server. Audio is forwarded for transcription and is not stored by Eumo. Existing text input and offline gameplay remain available.

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
