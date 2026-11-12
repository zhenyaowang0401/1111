# Changelog

These entries describe implementation milestones. Historical milestone names do not necessarily correspond to a published GitHub Release or a live deployment.

## Eumo 3.4.1 — Fitted hats and living wallpapers

- Redrew the four material hats with compact, centred silhouettes, fitted bands, fabric shading, gemstone facets, and small decorative details. Existing ownership and recipes are retained.
- Added pixel fireflies/leaves, rainfall, snow, and twinkling stars/meteors to the four rare backgrounds, including friend visits. Effects stay behind furniture and respect reduced motion.
- Reduced background prices to 60/100/160/240 stars; existing owners receive their price difference once.
- Dragging a placed item outside the home frame now puts it away without deleting the item or spending materials. The drag preview explains the action; mouse and touch are supported.

## Eumo 3.4.0 — Direct decorating and material collections

- Added mouse/touch furniture dragging with room-boundary validation, move-in-place, keyboard nudging, removal, and saved/shared coordinates. Legacy placements remain valid.
- Added four tiered pixel mural backgrounds, a television, three material furniture recipes, and four material-exclusive hats.
- Versioned new-session material drops at 40% per ten-minute checkpoint, independently of 3% golden rolls. Existing inventory, star earnings, and active legacy sessions are preserved; new demos no longer grant materials.
- Tested drag/move/cancel, mobile touch, save reload, background purchases, shared coordinates, exact material redemption, reserved items, reward distribution, split-session equivalence, and legacy rewards.

## Eumo 3.3.0 — Built-in desktop updates

- Added periodic update discovery, a desktop-only update notice, Help controls, and a native Check for updates menu.
- Added explicit Windows download and restart/install actions using electron-updater, with saved progress, paused timers, retries, checksum verification, and downgrade prevention.
- Added architecture-specific Mac feeds with a DMG download fallback while releases remain ad-hoc signed.
- Published verified, version-pinned update metadata alongside installers, keeping each release a draft until all assets are uploaded.
- Tested real updater downloads against local fixtures, corrupt-file rejection, downgrade rejection, trusted IPC, UI states, and saving before restart.

## Eumo 3.2.0 — Voice input for chat

- Added microphone controls to the inline and expanded chat composers, with editable transcripts and explicit sending.
- Shared bounded recording and WAV conversion across browsers and Electron, with permission/error feedback and microphone cleanup on cancellation or navigation.
- Added a server-only, rate-limited transcription endpoint using the existing AI provider settings or optional voice-specific overrides.
- Added audio-only native desktop permission handling and the macOS microphone usage description.
- Tested recording with synthetic microphone input in Chromium and Electron, API validation and permission boundaries, chat regression, and responsive layouts. Live provider recognition quality requires production credentials.

## Eumo 3.1.5 — Countdown alignment

- Raised the countdown by six pixels on desktop layouts at least 801 pixels tall, balancing the whitespace above and below the digits.
- Kept the duration buttons, surrounding sections, compact windows, and mobile layouts in place.

## Eumo 3.1.4 — More comfortable focus-panel spacing

- Spread spare sidebar height across small, bounded gaps between the timer, statistics, progress, and music sections.
- Reduced the empty area below the music card while keeping compact windows and mobile layouts unchanged.
- Verified 13 desktop viewport/DPI combinations in idle, running, and paused states, plus mobile layout checks.

## Eumo 3.1.3 — Consistent music card on web and desktop

- Restored the Music controls above the current-track card and removed viewport rules that hid the card in shorter windows.
- Kept the card's vinyl animation tied to actual playback and pause state.
- Adjusted compact desktop spacing so the track card and animation toggle remain visible without overlapping.

## Eumo 3.1.2 — Playback icons and spinning vinyl

- Added familiar repeat-one and sequential-play icons, with localized hover and screen-reader labels.
- Replaced the main Music label and speaker with a vinyl record, sharing the artwork with the music room.
- Tied rotation to actual audio playback, retaining the current angle on pause or buffering and honoring reduced-motion settings.
- Preserved playback order, saved mode, keyboard controls, and responsive layouts across web and desktop builds.

## Eumo 3.1.1 — Downward digging tools

- Corrected the spoon to scoop downward and both drills to point into the ground, using the shared character and shop artwork.
- Kept downward tool tips clear of floating-window controls at different sizes.
- Rebuilt standalone web downloads and desktop installers with the corrected artwork.

## Eumo 3.1.0 — Windows and macOS desktop apps

- Published installers for Windows x64, Mac Apple silicon, and Mac Intel, built and tested through GitHub Actions.
- Added a native, draggable, always-on-top floating mole with no browser address bar. The main window continues to own the session and rewards while hidden.
- Bundled the web game's local features and assets for offline desktop use; chat and friends continue to use the existing HTTPS backend.
- Added progress export and import through Help. Backups exclude chat history and friend credentials.
- Added installer checksums and documented the first release's signing and notarization limitations.

## Eumo v3 — Simpler navigation and mine controls

- Removed the Inventory page and navigation item; legacy `#rewards` links now open Home. The chest still manages finds, golden displays, and sales for 99 stars.
- Replaced Hide animation text with a glasses icon, retaining tooltips, screen-reader labels, toggle state, and saved preferences.
- Removed the VIEW range and Drag to explore labels while preserving depth, geology, dragging, keyboard controls, and Surface/Mole navigation.
- Limited the third onboarding step to outfits and Home; broader visual changes were handled separately.

## Eumo v3 — Explicit language selection

- Adopted the approved globe icon, current-language label, and dropdown arrow. The menu offers English and Simplified Chinese with a check beside the current choice.
- Shared the component between setup and onboarding. Opening the menu does not change language; selecting an option saves the preference. Arrow keys, Enter, Escape, and outside clicks are supported.
- Preserved interface, chat-language, and floating-window synchronization and rebuilt all three offline entry points.

## Eumo v3 — Small accessories replace clothes

- Retired the five clothing items and category. Existing saves automatically unequip them and refund their original star prices once.
- Kept the star pin and added heart, leaf, flower, moon, mushroom, bell, and crystal pins: eight accessories priced at 5–22 stars, using shapes no larger than 6×6 pixels, with one equipped at a time.
- Shared accessory shapes between shop icons and character rendering across Home, the mine, friends, and floating windows.
- Explored globe and text-based language icons; the globe option was subsequently selected.

## Eumo v3 — Optional onboarding

- After initial mole setup, players can take a four-step tour or start immediately. The tour uses their own mole and highlights the relevant interface areas.
- Supported both languages, keyboard navigation, skipping, back navigation, Help replay, phones, and shorter windows. Music and AI share a step with separate highlights.
- Completing the tour focuses the start button without starting a timer or changing progress. Completion and dismissal are remembered locally; existing players are not forced through the tour.

## Eumo v3 — Bilingual interface and real friends

- Removed the four demo friends and added an invitation to connect real friends when the list is empty.
- Added English/Simplified Chinese selection in Mole setup, defaulting to English and remembering the choice across labels, buttons, catalogs, dialogs, dates, and floating windows.
- Mole greetings and game reactions follow the interface language. Chat replies follow the current message's language, explicitly included in the server request.
- Preserved names, tasks, notes, chat text, saves, materials, and friendships. Onboarding was proposed here and implemented in the later milestone above.

## Eumo v3 — Craft home decorations from discoveries

- Added five original pixel decorations: mushroom planter, mushroom lamp, crystal wind chime, fossil frame, and starry mobile. Each recipe uses one or two matching materials.
- Added Craft decor entry points in Home, the chest, and collection views, with recipe previews, available-material counts, and confirmation. Entering while running pauses the session.
- Reserved displayed and head-mounted materials. Crafting spends no stars or golden finds; crafted objects are permanent, free to move, and do not automatically replace furniture.
- Added persistent discovery records so spent materials remain known in the collection, with compatibility for existing inventory and home saves.
- Added the black-and-white Tuxedo cat hat for 15 stars, bringing the hat catalog to 14.
- Added tests for atomic deductions, repeat crafting, insufficient materials, changing state, and real-browser placement; rebuilt offline entries.

## Eumo v3 — More animal hats

- Added Kitten (24 stars), Puppy (28), Frog (32), Panda (45), Fox (50), and Lion (60).
- Shared pixel definitions across shop icons and character rendering, preserving category replacement, mixed outfits, older saves, and friend appearance catalogs.
- Completed Chinese outfit reactions and rebuilt offline entries. Material crafting was only a proposal at this milestone.

## Eumo v3 — Tunnel companion window

- Replaced the rounded floating card, halo, and timer capsule with a complete pixel tunnel: soil walls, ladder, tunnel floor, and mole.
- Used the actual geology renderer and digging depth. Tools and soil particles animate while running; pausing and Break stop digging without adding separate progress.
- Used compact top status and bottom control bars. The requested default remained 240×320 at this milestone, with support for tall hats, different aspect ratios, and a clear character hit area.
- Passed real Picture-in-Picture regression checks, including 400×260, and rebuilt offline entries.

## Eumo v3 — Smaller default bubble

- Reduced the floating-window request from 300×440 to 240×320 while retaining resizing.
- Removed the fixed running-session sentence and hid empty speech bubbles; pause, rest, and petting feedback remained.
- Passed real Picture-in-Picture checks for the compact layout and timer controls.

## Eumo v3 — Bubble companion window

- Introduced a rounded bubble card with a larger centered mole, increasing the character canvas from 112 to 208 pixels while preserving equipment, movement, and crisp pixels.
- Replaced the rectangular scene with a transparent character, oval ground, and soft halo. Time and status used a capsule, with reactions in a small speech bubble.
- Added a labeled return icon and rounded session controls, with compact layouts for small windows and the system title bar retained.
- Passed real Picture-in-Picture checks at 300×440, 320×310, and 240×340.

## Eumo v3 — Floating companion

- Added Float mole to Focus using desktop Chrome/Edge Document Picture-in-Picture, with system dragging, resizing, and cross-tab visibility.
- Rendered the existing mole independently in the small window, including color, outfits, tools, and interactions while the main tab is in the background.
- Shared the original timer, pause/resume, end confirmation, and reward settlement; resting does not dig or create a second progress record.
- Required the original tab to remain open. Closing the small window does not end a session; closing the main page cleans it up. Unsupported browsers and failures receive clear messages.
- Rebuilt offline files and added a real Chromium Picture-in-Picture test.

## Eumo v3 fix — Golden collectibles in the home chest

- Connected the chest to existing golden inventory, showing counts and display states for all ten collectibles without requiring new discoveries or save migration.
- Added display, retrieve, and confirmed 99-star sale actions using shared inventory logic; displayed copies remain reserved.
- Kept ordinary head displays and added vertical scrolling for phones and shorter windows.
- Added browser coverage from a real timed golden discovery through chest display, canvas rendering, reload, duplicate-sale prevention, and session-state restrictions.

## Eumo v3 fix — Clicking the mole underground

- Delayed pointer capture until a mine drag moves more than six pixels, restoring single and triple clicks on the idle mole in deep tunnels.
- Preserved mouse/touch tapping without triggering petting during real drags, and cleared gestures when released outside the canvas.
- Added mouse and touch regressions at 120 metres for petting, spinning, dragging from the mole, and clicking after dragging.

## Eumo v3 — Music, interactions, tunnel exploration, and golden finds

- Added four supplied MP3s unchanged: two white-noise tracks, one groove track, and one soft-music track. Kept Warm Focus and embedded all five offline.
- Added an idle jump and full spin on three clicks within 1.1 seconds; equipment follows the motion and reduced-motion preferences suppress it.
- Added paused/ended tunnel exploration by dragging, wheel, and keyboard, plus Surface/Mole controls. Running follows the mole without changing progress.
- Added ten original golden collectibles with a combined 3% bonus chance at each regular ten-minute discovery. Stable seeds and sequence numbers prevent rerolls; Demo and Break are excluded.
- Added permanent storage, a dedicated home display, and confirmed 99-star sales with reserved display copies and duplicate-sale protection.
- Changed timing to millisecond accumulation to prevent floating-point loss after pause/resume; historical depth displays as integers.
- Updated the interface and package to V3 while retaining friend-backend configuration without a database migration.

## Eumo v2 — Real friends and online summaries

- Renamed Companions to Friends and added friend codes, copying, requests, acceptance, rejection, withdrawal, and removal.
- Mutual friends share actual status, focus summaries, and mole appearance, tools, and animation. Updates occur every 15–30 seconds; background tabs become Away and missing heartbeats become Offline after 90 seconds. Tasks and chats are excluded.
- Kept the four demo characters in a separate Demo moles area at this milestone. Sharing can be paused; removing a friendship revokes access for both parties.
- Added Supabase PostgreSQL atomic RPCs, RLS/execution permissions, hashed cookie identity, and summary allowlists. Production use requires Supabase/Vercel configuration.
- Tested the complete flow in two independent browsers against PostgreSQL; local testing was not presented as production verification.

## Eumo v2 — Expandable music library and retro player

- Added the four-square library control and a current-track card on taller screens, with soft music, groove, and white-noise categories in a purple retro window.
- Preserved the original Warm Focus audio. Unavailable tracks explicitly displayed Coming soon rather than using generated substitutes.
- Used one audio player for volume, seeking, track navigation, and repeat modes. Reload remembers preferences without autoplay or timer changes.
- Centralized tracks in `music-catalog.js`; standalone builds embed configured files without duplicating the default track.
- Added byte-range support to the development server and tests for playback, unavailable tracks, mobile layouts, retries, and offline bundling.

## Eumo v2 fix — Working and resting together

- Aligned the companion with the timer: dig during Study/Work, stop when paused, resume together, rest after manual or timed completion, and return to the surface only after finishing the daily summary.
- Added pause/resume reactions and distinct Break/Demo wording. Local event reactions do not call a paid model.
- Placed current state after chat history in prompts, excluded obsolete model responses from outgoing history, and cancelled late replies when activity changes while preserving drafts.
- Updated the persona to `mole-companion-1.1`, with 42 bilingual demonstrations, 28 independent evaluation scenarios, and activity state in SFT exports. This was prompt/rule calibration, not weight training.
- Added state-matrix, button-sequence, stale-history, and asynchronous-race regressions; rebuilt all offline entries.

## Eumo v2 — Cloud chat integration and persona

- Added the Vercel `/api/chat` proxy, initially defaulting to Qwen3-8B with configurable OpenAI-compatible providers. Keys stay off the client.
- Added multi-turn chat, a full conversation window, retry drafts, optional context sharing, and independent local history without interrupting the timer.
- Built context from real Study/Work sessions, tasks, and outfit events; Demo and Break are not represented as formal study.
- Kept outfit and focus-event reactions local; only actively sent messages call the cloud model.
- Added the actual persona prompt, 20 bilingual demonstrations, SFT seed export, and 16 independent evaluation scenarios.
- Added API contract and browser-to-proxy tests. No live-model conversation or weight fine-tuning was claimed without a configured provider key.

## Eumo v2 fix — Retro chat window and compact timer

- Replaced the reserved left-side space with a purple retro desktop chat window, including a narrow title bar, pixel bevels, dynamic avatar/name, and inset composer.
- Added mouse and keyboard collapse/expand. At this milestone, reactions were prewritten and sending was visibly unavailable; AI was not connected yet.
- Removed excessive flexible height from the timer, reduced countdown spacing, and restored the compact, left-aligned animation control.
- Preserved the 72:28 panels and full layout at 100% zoom, with chat-boundary, running-state, mobile, and offline checks.

## Eumo v2 fix — Conversation space and panel proportions

- Adjusted desktop mine and timer panels to approximately 72:28 with aligned top and bottom edges.
- Reserved 64–132 pixels beneath the mine information row for future conversation without adding chat functionality at this stage.
- Allocated timer-panel space by available height and included the reserved area in layout calculations.
- Expanded validation to 13 desktop configurations and rebuilt offline entries.

## Eumo v2 fix — Screen fit and two hours of soil

- Constrained desktop layout by both available width and height. Short screens rearrange controls while preserving readable numbers and the complete scene.
- Kept ordinary digging in soil for two hours, then introduced stone, sand, slate, granite, crystal, and basalt at 240/300/360/480/600/720 metres.
- Prevented unreached layers from appearing early. Replaced raised square rocks with softer colors, sparse flat pebbles, and soil flecks.
- Added complete-visibility checks across 13 desktop size/DPI combinations and three timer states, plus geology-boundary checks through an actual 120-minute flow.
- Preserved daily return, rewards, outfits, Home, and music rules; rebuilt downloads.

## Eumo v2 fix — Moderate sizing and visible surface return

- Reduced maximum page width from 1840 to 1480 pixels, with smaller sidebar/timer limits and shop height.
- Made all daily-summary closing paths submit the surface return, clear jumping, and redraw immediately instead of waiting for the next animation frame.
- Displayed Surface / 000m and renamed cumulative depth to All-time depth.
- Added actual-canvas regressions with hidden animation, paused frames, and offline builds while preserving cumulative progress.

## Eumo v2 — Readable typography, daily return, and geology

- Expanded the layout to 1840 pixels across Focus, Home, reports, shop, and companions. Small screens stack timer controls and size trend axes to their container.
- Restored system fonts for body text and clear tabular timer digits without pixel shadows; retained the pixel logo.
- Renamed setup labels to Your mole, Mole name, and Mole setup; removed PREVIEW.
- Kept a prominent daily Finish action and removed Export. Confirming saves results and returns to the surface, preserving rewards/history and ongoing cross-midnight sessions.
- Added mine-origin and local-date fields, positioned the mole on the actual surface, and slightly reduced eye size.
- Introduced seven distinct geology materials, with more roots and vines in shallow soil.
- Tested local timezones, minute boundaries, resume, daylight-saving changes, and the daily return flow.

## Eumo v2 — Bounded shop, pixel font, and more glasses

- Kept a fixed mole preview beside an independently scrolling desktop shop, with wheel, scrollbar, keyboard, and touch support. Phones use a compact preview above the shop.
- Added Sunglasses, Round glasses, Square frames, Heart frames, and Star shades at 6/8/10/24/45 stars; moved existing goggles into the mutually exclusive Glasses category.
- Adopted local Pixelify Sans across the interface at this milestone, with small text at least 12 pixels and the SIL OFL license embedded offline.
- Branded the interface Eumo v2 and removed redundant tool-animation wording while retaining current/default tool controls.
- Added the [development log](docs/DEVLOG.md), preserving saves and reward rules.
- Tested actual shop scrolling, glasses artwork, minimum font sizes, and offline fonts. Earlier v7-style names below refer to prior development milestones.

## v7 — Eumo, categorized wardrobe, and game chest

- Renamed the product Eumo while retaining the storage key and compatible Supermo / LOOP_PET standalone entry points.
- Limited discovery displays to the mole's head at Home, positioned above hats. Removed hand displays and kept finds out of the mine/fitting preview.
- Introduced a wooden chest with a clasp and inventory slots, item details, and actions using real quantities and placement constraints.
- Added seven hats, five clothing items, and five scarves with category replacement and cross-category combinations; preserved existing glasses and the star pin.
- Added six separately purchased tools with distinct digging artwork/animation and a free default pickaxe. Prices and rarity do not change reward speed.
- Added purchase, category, legacy-save, head-display, tool-pixel, and responsive-chest regressions.
- Kept Warm Focus (3), sleep behavior, repeatable demo rewards, and normal cumulative rules.

## v6 — Supermo, round burrow, and clearer companionship

- Renamed the product Supermo while preserving the storage key and compatible legacy HTML copies.
- Used the latest supplied Warm Focus (3) MP3 and softened the two-syllable petting sound with an envelope, gentle harmonics, and breathiness.
- Made sleep explicit with floating zzz, a changing nose bubble, and layered breathing, distinct from paused rest.
- Replaced the brick room with a round earthen burrow, proportioned furniture, floor alignment, contact shadows, wood grain, and a woven rug.
- Added chest controls to hold, return, and pick up finds without duplicating inventory or changing rewards.
- Added six geology layers, mixed color areas, pebbles, roots, vines, worms, and insects without new rewards or controls.
- Tested sleep pixels, chest quantities, held displays, track duration, geology variation, and mobile layout.

## v5 — Home, actual pickups, and Warm Focus

- Generated path stars and discoveries from accumulated active time. Splitting sessions does not increase rewards; ending early keeps progress and reload does not settle twice.
- Kept repeatable 15-second demos granting 1 star, 5 metres, and 1 item for purchase testing, excluded from formal reports.
- Added Home through the second navigation icon, with four placement spots, furniture, room themes, display items, and paused decorating.
- Replaced synthesized rain with the supplied Warm Focus MP3, embedded offline, and made petting use two louder doo-doo syllables.
- Added idle drowsiness, sleep, and waking while keeping jumping and `yeeeeee`, with no absence penalty.
- Combined Study/Work results, tasks, daily summary, and JSON export in Today.
- Sent returning players directly to the timer, with optional tasks and a simple view; focus sessions do not show pickup popups.
- Added continuous-reward, Home, daily-summary, music, and audio-waveform regressions.

## v4 — Reliable entry and earless mole

- Fixed START when embedded previews prohibit native form submission.
- Shared entry logic across the button, arrow, and Enter in the name field, including Chinese and IME composition.
- Switched pages before attempting URL history updates so restricted History APIs no longer block navigation.
- Used the same earless character in setup, the mine, Equipment, and companions.
- Added restricted-iframe and actual-artwork regressions; organized the repository, bilingual entry docs, build script, and downloadable standalone file.

## v3 — Setup, daylight, and companion previews

- Added name/color setup, 12 presets, custom colors, and save/cancel.
- Used device-local time to select four sky/theme periods.
- Added four clearly labeled example companions with progress and expandable item counts.
- Preserved focus and digging progress when changing appearance.

## v2 — Simpler English interface and focus reports

- Switched the interface to English and reduced decorative copy.
- Added idle petting, jumping, sound, and `yeeeeee`, disabled during sessions.
- Supported four simultaneous, persistent equipment items.
- Added actual Study time, trends, calendar, and logs split at local midnight.
- Adjusted rain sound and added volume controls.

## v1 — Pixel digging loop

- Introduced a dark pixel style and original grid-based character.
- Implemented actual soil digging, a descending camera, pausing, and complete settlement.
- Split out treasure and equipment pages, with a demo and local saves.
