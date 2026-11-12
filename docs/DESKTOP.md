# Eumo for Windows and macOS

## Downloads

- [Web app](https://1111-phi-ten.vercel.app/#focus)
- [GitHub Releases: installers, release notes, and checksums](https://github.com/zhenyaowang0401/1111/releases/latest)
- [Windows x64 installer](https://github.com/zhenyaowang0401/1111/releases/latest/download/Eumo-Windows-x64-Setup.exe)
- [Mac Apple silicon DMG](https://github.com/zhenyaowang0401/1111/releases/latest/download/Eumo-macOS-arm64.dmg)
- [Mac Intel DMG](https://github.com/zhenyaowang0401/1111/releases/latest/download/Eumo-macOS-x64.dmg)

GitHub Actions builds these installers on Windows and macOS and publishes them together after all builds pass. The repository's source-code ZIP is different from an application installer.

Windows builds target Windows 10 / 11 x64. Mac builds require a macOS version supported by Electron 45; download the package matching your processor. This first release has no Windows publisher certificate, Apple Developer ID signature, or Apple notarization. Mac builds use ad-hoc signing, which is not Apple certification. Your system may ask you to confirm an unknown publisher. Download from this repository's Releases page; checksums are listed in `SHA256SUMS.txt`.

## Windows and saved progress

- The main window uses native Windows or Mac window controls and adapts to the screen.
- Float mole is a native, frameless, always-on-top window. Drag the name area to move it. The return icon restores the main window; × closes only the floating window.
- Closing the main window while the floating window is open hides the main window. The original session still owns the timer and reward state; there is no second counter. Use the application menu's Quit command to exit completely.
- The installer includes local focus timers, outfits, home decoration, music, and reports for offline use. Chat, voice transcription, and friends connect to the existing HTTPS services. Offline or certificate failures produce a connection error; certificate verification is never bypassed.
- Web and desktop saves are separate and do not automatically sync. Pause your session, then use **Help → Move / back up progress** to export a JSON backup and import it on another device. Importing replaces that device's progress after confirmation. Chat history and friend credentials are not exported; reconnect friends separately.
- Normal application updates reuse Eumo's data directory. Back up your progress before uninstalling or clearing application data.

## Updating an installed app

Version 3.3.0 introduces the updater. If you have an older version, close Eumo and install the new package over it once; you do not need to uninstall or clear your saved progress.

Installed apps check for updates after launch and every six hours. Use **Help → App updates** or **Eumo → Check for updates** to check manually. An update notice appears when a newer stable version is available.

On Windows, choose **Download update**, continue using the app, then choose **Restart and install**. Eumo asks for confirmation, pauses an active timer, saves progress, and installs the checksum-verified package before reopening. Downloading does not interrupt the timer. Declining installation keeps the current version running; ordinary quitting does not silently install it. Failed checks or downloads can be retried.

Mac currently checks for updates and links to the matching Apple silicon or Intel DMG. Quit Eumo and replace the app in Applications after the download finishes. Automatic in-place Mac updates require Apple Developer ID signing, which these releases do not yet have.

## Microphone and voice input

The microphone button is available in both chat composers. Click to request access and start recording, then click again to transcribe into an editable draft. Eumo asks through a native permission dialog; macOS also requests system microphone access. Windows microphone privacy settings must allow desktop applications. Previously granted permissions may not prompt again.

Recordings stop at 45 seconds. Closing or hiding the chat, switching pages, or hiding the app cancels recording and releases the microphone. Audio is sent only after finishing a recording and is not saved by Eumo. Transcription requires the online speech endpoint; the offline timer remains available. Camera access stays blocked.

## Building and publishing

Use Node.js 22 and run `npm ci`. Start local desktop development with `npm run desktop:dev`.

- Windows: `npm run desktop:pack -- --win --x64`
- macOS: `npm run desktop:pack -- --mac --arm64` or `--mac --x64`
- Unit tests: `npm run test:desktop`
- Native-window smoke test: `npm run test:desktop:smoke` (requires a graphical desktop)

`scripts/prepare_desktop.cjs` generates `desktop/web` from the current web source. Do not edit generated files directly. The bundle includes pages, styles, browser scripts, and assets; it excludes server code, credentials, databases, and workspace files. Installers are written to `desktop-dist`; installer binaries are uploaded to Releases rather than committed to Git.

Pushing a `desktop-v*` tag triggers `.github/workflows/desktop-release.yml`. Windows x64, Mac arm64, and Mac x64 each run native-window checks and build their installers. A release is published only after all three succeed. Manually running that workflow creates Actions artifacts without publishing a release.

Updating the website does not automatically update installed clients. Publish a new desktop version, then use the application's **Download updates** menu to open the download page.

## Security boundaries

Renderers have Node integration disabled and sandbox, context isolation, and web security enabled. The fixed website origin maps to packaged local resources inside Electron, preserving the web app's relative paths and storage behavior. Only `/api/chat` and `/api/friends` are forwarded to the actual HTTPS service.

Friend credentials stay in the main process's HttpOnly cookie jar. External pages open in the default browser rather than running inside a window with the preload bridge. TLS validation remains enabled, and AI or database secrets are never included in the client.

## Update feed and release integrity

`electron-updater` reads stable metadata from the public GitHub Release assets: `latest.yml` for Windows, `latest-arm64-mac.yml` for Apple silicon, and `latest-x64-mac.yml` for Intel Mac. The release job validates each installer's SHA-512 hash and pins its metadata URL to that release tag. All assets are uploaded to a draft before the release becomes latest. Keep these metadata files with the installers when publishing future versions. No GitHub token is embedded in the app. Development and smoke-test runs do not poll production updates.
