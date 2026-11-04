# Scene-first home and wardrobe

The default view emphasizes the existing pixel room or mole. Editing controls live
in non-modal panels, beside the scene on wide screens and below it on small screens.
The four navigation icons now carry short translated labels.

Home:
- Decorate opens the existing position, furniture and theme controls. Close/Escape
  returns focus to Decorate. Existing pause-on-decorate behavior remains; closing
  does not resume a session.
- Chest and crafting remain visible entry points. Held and golden-display controls
  appear only when an item is actually displayed.
- The full 384 × 288 scene keeps its original aspect ratio. Chest hit area and speech
  remain relative to the canvas, not to the surrounding letterbox.

Wardrobe:
- Categories, My items and Shop open a compact item panel. Browsing never purchases.
- Prices are in the Buy button. Equipped items have a check and the original Remove
  action. Only rare or higher tiers retain a rarity label. Current equipment remains
  available in the panel footer, including Unequip all.
- Existing item costs, category replacement, tool behavior and persistence are unchanged.
- Panels close when leaving their page. Their open state is transient and not saved.

Visibility control: an open pixel eye means the scene is visible, a closed eye means
it is hidden. Existing translated labels, pressed state and storage remain intact.

References inform hierarchy and restraint, not copied artwork:
- https://github.com/emilkowalski/skills
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

Validation:
- tests/test_scene_panels.py: no charge on browse, exact buy/equip/placement, session
  pause, close/Escape/focus, five viewport sizes, Chinese, eye states, reduced motion,
  and offline entry.
- tests/test_viewport.py: Focus idle/running/paused across 13 desktop/DPI combinations,
  mobile layout and offline entry.
- tests/test_crafting_browser.py: reserved materials, crafting confirmation and cancellation,
  exact costs, placement and persistence, running-session guards and offline crafting.
- tests/test_golden_chest.py: collection, room display, store/sell, +99 once, mobile UI.
- tests/test_accessories.py: catalog migration, exact purchases and replacement, localization.
- tests/test_locale.py and tests/test_onboarding.py: translated UI, keyboard behavior,
  optional tour, responsive layouts and offline use.

Standalone HTML entries rebuilt with scripts/build_standalone.py.
