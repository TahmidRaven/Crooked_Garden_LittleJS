# Credits and asset provenance

- **Game design/development:** [TahmidRaven](https://tahmidraven.com), assisted by OpenAI Codex and OpenCode (GPT-6.1 Sol).
- **Studio:** After Hours Arcade. Orange raven mark reused unchanged from the owner's [FeastFury branding](https://github.com/TahmidRaven/FeastFury/blob/5994a9565971c66801405bfe3eb5004e64c4f2ca/assets/FeastFury/UI/raven.png), at their request. Bundled as `public/assets/art/after-hours-arcade.png`. Studio branding is not licensed as part of the third-party CC0 packs; source and SHA-256 are recorded separately in the asset manifest.
- **Engine:** LittleJS, Frank Force / KilledByAPixel, MIT. Installed package includes its license. https://github.com/KilledByAPixel/LittleJS
- **Build tooling:** Vite (MIT); see installed package license.
- **Initial visuals:** original procedural Canvas2D drawings made for this project.
- **How to Play illustrations:** cropped from this game's real showcase screenshots (including the credited Kenney art below); no external tutorial images. Flower/water close-ups are arranged side by side with circular masks; wider loop crops preserve gameplay context. Reproduction: `scripts/crop-help-images.py`; source screenshots, sizes and SHA-256 hashes: `public/assets/help/manifest.json`.
- **How to Play GIFs:** recorded from real pointer/Shift gameplay, encoded with `scripts/capture-help-motion.mjs` and `scripts/encode-help-motion.py`. No injected game state. GIF hashes/dimensions are in `public/assets/help/motion-manifest.json`.
- **Itch cover:** composed promotional artwork using this game's original garden shapes, credited Kenney sprites below, and the studio raven logo. Hunter sprite colours match runtime. Source: `scripts/make-cover.py`. Not represented as a gameplay screenshot.
- **Initial sound effects:** synthesized tones made for this project.
- **Concept images:** OpenAI image generation; used for discussion only, not bundled.

## Current dark forest background — Eder Muniz

- **Artist / source:** [Eder Muniz (edermunizz), Free Pixel Art Forest](https://edermunizz.itch.io/free-pixel-art-forest).
- **License:** author's custom license, **not CC0**. Commercial game use and modifications are permitted with appropriate credit; redistribution/resale as a standalone asset is prohibited. The original archive license is included unchanged as `public/assets/licenses/eder-forest.txt`.
- **Open-source use:** the [author's linked terms](https://edermunizlicense.carrd.co/) explicitly permit open-source projects when the asset's license and credit are included. Relevant statements and the no-NFT/crypto restriction are documented in `public/assets/licenses/eder-forest-permissions.txt`. This game has no NFT/crypto use. The itch.io metadata names a different Creative Commons option; this project relies on the explicit archive/custom terms rather than relabelling it as Creative Commons.
- **Archive:** `Free Pixel Art Forest.zip`, downloaded from the author's free itch.io download on October 29, 2026; SHA-256 `2931f715abc770b4203a117bffea660ad9db1980603bdb36aa0ed83a1650d737`.
- **Used file / derivative:** the author's `Free Pixel Art Forest/Preview/Background.png`, colour-managed to sRGB to preserve its appearance in browsers, cropped to `(0,350,928,760)` to omit bright sky/excess canopy, then cross-blended across a 64px wrap boundary into `public/assets/art/dark-forest.png` (864×410). Only this in-game derivative is bundled, not the unused source pack or PSD. Reproduce with `python3 scripts/prepare-dark-forest.py path/to/Free-Pixel-Art-Forest.zip`; source/output hashes are recorded in the manifest.
- **Runtime:** cached dark/cool readability treatment, with slow horizontal auto-scrolling. The scenery is reframed upward so its grass baseline sits under the existing planter; darker ground fills the space behind the bottom controls. The pot, vine root, levels and collision geometry do not move. Scrolling pauses in menus/pause screens and stays static for reduced-motion preferences.

## Button hover and select sounds — Kenney

- **Pack:** [Interface Sounds](https://kenney.nl/assets/interface-sounds), by Kenney, version 1.0. Official page/archive CC0 notice verified October 27, 2026.
- **Download:** https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip
- **Files:** `Audio/tick_001.ogg` → `public/assets/audio/ui-hover.ogg`; `Audio/click_001.ogg` → `public/assets/audio/ui-select.ogg`.
- **Changes:** original audio files unchanged; renamed only, played quietly through the shared sound preference. Hover is throttled; select confirms mouse, keyboard and touch actions. These are separate from the original synthesized gameplay effects.
- **License:** CC0 1.0 Universal. Original notice included as `public/assets/licenses/kenney-interface-sounds.txt`; source paths/hashes are recorded in the asset manifest. No external audio CDN or paid content is used.

## Background music

- **Track:** “calm theme” by [pebonius](https://pebonius.itch.io/).
- **Source and license evidence:** https://opengameart.org/content/calm-music-0 — author lists CC0 and invites use in games. Verified October 22, 2026.
- **License:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
- **Original download:** https://opengameart.org/sites/default/files/calm_theme.ogg
- **Bundled file:** `public/assets/calm-theme.ogg`. Renamed only; playback loops at reduced volume. No audio edits.
- **SHA-256:** `8a701a803f365c8fe1257b2e18276a7fa8b0d62a9af601f973d43ccf4e354705` (local file matches a fresh source download).

## Flying insect sprites — Kenney

- **Pack:** [Platformer Art Deluxe](https://kenney.nl/assets/platformer-art-deluxe), by [Kenney Vleugels](https://kenney.itch.io/).
- **License:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), verified on the official asset page and the archive's `license.txt`, October 22, 2026. The included notice calls this the “Platformer Art Complete Pack.”
- **Download:** https://kenney.nl/media/pages/assets/platformer-art-deluxe/cb30f83169-1677696393/kenney_platformer-art-deluxe.zip
- **Files used from `Extra animations and enemies/Enemy sprites/`:**
  - `fly.png` → `public/assets/art/fly-flight-1.png`.
  - `fly_fly.png` → `public/assets/art/fly-flight-2.png`.
  - `bee.png` → `public/assets/art/bee-flight-1.png`.
  - `bee_fly.png` → `public/assets/art/bee-flight-2.png`.
- **Changes:** source PNGs unchanged; renamed, scaled, mirrored and slightly banked at runtime. Hunter flies' neutral grey body pixels are recoloured warm amber at load time, preserving light wings and alpha. Body anchors keep the insect aligned while its wings change pose. Insect colours stay consistent across states: active bugs have a soft glow, while stunned bugs use a static full-colour wing pose with no glow and a star indicator. No grey hit silhouettes are bundled. Wing cycles are offset between insects, freeze on pause/stun, and respect reduced-motion settings. The old walking ladybug art is no longer bundled. AI, hitboxes and capture rules are unchanged.
- **Bundled license:** `public/assets/licenses/kenney-platformer.txt` (archive notice, whitespace normalized).
- **Integrity:** exact SHA-256 hashes for all four insect files are in `public/assets/manifest.json` and checked by `npm test`.

## Garden foliage — Kenney

- **Pack:** [Foliage Sprites](https://kenney.nl/assets/foliage-sprites), by [Kenney](https://kenney.itch.io/).
- **License:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), verified on the official asset page and the archive's `License.txt`, October 22, 2026.
- **Download:** https://kenney.nl/media/pages/assets/foliage-sprites/b65bd70c69-1677495980/kenney_foliage-sprites.zip
- **Used file:** `PNG/Flat/sprite_0042.png` → `public/assets/art/foliage.png`.
- **Use:** unchanged source PNG retained for `scripts/make-cover.py` and `scripts/make-itch-page.py`, which tint/scale/mirror it for promotional artwork. It is no longer loaded by the game now that Eder Muniz's forest is active.
- **Bundled license:** `public/assets/licenses/kenney-foliage.txt` (archive notice, whitespace normalized).
- **SHA-256:** `8e701f5e6582de9e453b5b50a143bf8677721540eb37469820993583aa411264`.

## Starting planter — Kenney

- **Pack:** [Furniture Kit](https://kenney.nl/assets/furniture-kit), by [Kenney](https://kenney.itch.io/).
- **License:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), verified on the official page and archive's `License.txt`, October 23, 2026. The archive notice identifies Furniture Kit 2.0.
- **Download:** https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip
- **Original asset:** `Models/OBJ format/plantSmall1.obj` and `plantSmall1.mtl`; retained unchanged in `source-assets/flower-pot/`.
- **Bundled derivative:** `public/assets/art/flower-pot.png`, a transparent orthographic 2D render of the container only. The original plant is omitted, and a dark soil surface is added. Placement aligns that soil with the unchanged vine root. No 3D runtime is shipped.
- **Reproducibility:** `scripts/render-flower-pot.mjs` / `npm run art:pot`. Original mesh/material hashes and rendered PNG hash are in `public/assets/manifest.json` and checked by tests.
- **Bundled license:** `public/assets/licenses/kenney-furniture.txt` (archive notice, whitespace normalized).

## On-screen joystick and HUD icons — Kenney

- **Pack:** [Mobile Controls](https://kenney.nl/assets/mobile-controls), by Kenney.
- **License:** CC0 1.0 Universal, verified on the official page and archive's `License.txt`, October 24, 2026. Notice included as `public/assets/licenses/kenney-mobile-controls.txt`.
- **Download:** https://kenney.nl/media/pages/assets/mobile-controls/0d047b3be4-1754738457/mobile-controls-1.zip
- **Files:** `Sprites/Style C/Large (2×)/joystick_circle_pad_a.png` and `Sprites/Style B/Large (2×)/joystick_circle_nub_a.png` → `public/assets/art/joystick-pad.png` and `joystick-nub.png`.
- **Changes:** original PNGs unchanged; scaled, partially transparent and subtly sepia-tinted with CSS. Hashes and exact source paths are recorded in the asset manifest.
- **HUD icons:** `Vector/Icons/icon_pause.svg`, `icon_play.svg`, `icon_size_larger.svg` and `icon_size_smaller.svg` become `public/assets/ui/hud-{pause,resume,fullscreen,windowed}.svg`. Only white fills are recoloured cream (#E7E9CF); geometry is unchanged. Fullscreen is frameless; Resume retains its text label.
- **Sound icons:** `Vector/Icons/icon_music.svg` and `icon_music_disabled.svg` become `public/assets/ui/hud-music.svg` and `hud-music-muted.svg`, with the same cream-only recolour. The on/off icons replace the sound-status dot.

## First-drag tutorial hand — Kenney

- **Pack:** [UI Pack (RPG Expansion)](https://kenney.nl/assets/ui-pack-rpg-expansion), CC0, by Kenney.
- **File:** unchanged `PNG/cursorGauntlet_bronze.png` → `public/assets/art/tutorial-hand.png`. This is the middle pointing gauntlet in the first cursor row, scaled for display.
- **Use:** looping initial/idle guidance toward the nearest available water drop or flower, routing around static timber. Reappears after six seconds without growth in any garden and dismisses on growth input; no automatic gameplay. Also used unchanged as the menu/selection cursor, with a fingertip hotspot. Reduced motion uses a static guide hand. License notice: `public/assets/licenses/kenney-ui-rpg.txt`; source and hash recorded in the asset manifest.

## Current buttons, icons and rating stars — Kenney

- **Pack:** [UI Pack 2.0](https://kenney.nl/assets/ui-pack), by Kenney. Verified October 27, 2026.
- **License:** CC0 1.0 Universal. Original archive notice included as `public/assets/licenses/kenney-ui-pack.txt`.
- **Download:** https://kenney.nl/media/pages/assets/ui-pack/f651646eab-1718203990/kenney_ui-pack.zip
- **Original files:** fourth-row `Vector/Grey/button_rectangle_line.svg`, `button_square_line.svg`, `button_round_line.svg`; `Vector/Extra/icon_repeat_light.svg`, `icon_play_light.svg`; `Vector/Yellow/star.svg`; `Vector/Grey/star_outline.svg`.
- **Changes:** buttons, light icons and empty stars use deterministic palette replacements to match the garden; all SVG geometry remains unchanged. Gold star is unchanged. The rectangle has normal/primary palette variants; Rewind mirrors the repeat icon through CSS and Burst displays two play icons. Exact original/output SHA-256 hashes are in the asset manifest.
- **Reproduce:** `python3 scripts/prepare-simple-ui.py` downloads the official free archive; `--archive <zip>` reuses a local copy. Only the selected assets/license are bundled, not Kenney's logo or preview sheets.

## Previous wooden interface frames — Kenney

- **Pack:** [UI Pack - Adventure](https://kenney.nl/assets/ui-pack-adventure), by Kenney. The archive identifies version 1.1.
- **License:** CC0 1.0 Universal, verified on the official asset page and the archive's `License.txt`, October 27, 2026. Bundled notice: `public/assets/licenses/kenney-ui-adventure.txt`.
- **Download:** https://kenney.nl/media/pages/assets/ui-pack-adventure/9a877376bc-1723597274/kenney_ui-pack-adventure.zip
- **Earlier use:** the V4 promotional video records this wooden interface. Its license notice is retained for that media; the unused runtime SVGs and stylesheet have been removed.

## Barbed branch hazards — Kenney

- **Pack:** [Platformer Art Deluxe](https://kenney.nl/assets/platformer-art-deluxe), by Kenney Vleugels, CC0. Uses the already included `public/assets/licenses/kenney-platformer.txt` notice.
- **Sources:** `Request pack/Tiles/dirtCaveSpikeBottom.png`, `Request pack/Tiles/dirtCaveSpikeTop.png`, and the opaque middle of `Base pack/Tiles/bridge.png`. The earlier central branch rail is no longer used.
- **Derivatives:** `public/assets/art/barbed-branch.png` (46×26 crooked-barb source tile) and `public/assets/art/timber-tiles.png` (38×22 backing source tile from `Base pack/Tiles/bridge.png`). Based on the approved **Timber + Barbs** comparison B, revised to plain planks instead of crossed crates, with surface-mounted hooks rather than a central branch stripe. The timber source is desaturated to 55% and darkened to 56%; both layers repeat independently, with no straight metal-spike artwork. Reproduce with `python3 scripts/prepare-branch-hazards.py path/to/kenney_platformer-art-deluxe.zip`. Exact source/output hashes are in the manifest.
- **Scope:** replaces the mossy shelf drawing only. The existing rectangular hazard bounds, level layouts and collision rules remain unchanged. Optional matching trees are research previews, not bundled game art.
- **Surface placement:** thicker timber fills the middle 14/26 of the existing obstacle height. Its fully opaque centre crop repeats over a continuous solid core, without rounded-cap gaps. Hooks-only sprites render last in the outer 8/26 each, overlapping each timber surface by 2/26 so they sit visibly in front. The central branch strip is omitted; the full artwork remains inside the original collision rectangle.

## Credit link icon — Kenney

- **Pack:** [Game Icons](https://kenney.nl/assets/game-icons), by Kenney, CC0. Original `PNG/White/2x/export.png` is bundled unchanged as `public/assets/ui/link-external.png`, displayed at a small fixed size beside credit links. Original license: `public/assets/licenses/kenney-game-icons.txt`; source/hash recorded in the manifest.

## Special thanks — playtesting & feedback

- **[Dan5626](https://dan5626.itch.io/)** — fellow solo developer and playtester. A huge help with suggestions and thoughtful feedback throughout development. Check out his games!

## Current game typeface — Kaph

- **Font:** [Kaph 1.20](https://ggbot.itch.io/kaph-font), designed by [GGBotNet](https://ggbot.itch.io/).
- **Files:** the user's Kaph 1.20 Regular and Italic WOFF2 files are copied unchanged to `public/assets/fonts/kaph-regular.woff2` and `kaph-italic.woff2` and loaded locally for all active game text, with system fallbacks for missing symbols. Duplicate OTF/TTF/WOFF copies were removed. No synthetic bold or italic is generated; the native engine splash is unchanged.
- **License:** SIL Open Font License 1.1, copyright © 2021–2024 GGBotNet, Reserved Font Name “Kaph”. Original notice included as `public/assets/licenses/kaph-OFL.txt`. Original source paths/hashes are recorded in the asset manifest. The permanent font page is credited instead of the expiring download token.

## Earlier interface typeface — Courier Prime

- **Font:** [Courier Prime](https://github.com/quoteunquoteapps/CourierPrime), by The Courier Prime Project Authors.
- **Source:** [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/courierprime), `CourierPrime-Regular.ttf` and `CourierPrime-Bold.ttf`, downloaded October 27, 2026.
- **License:** SIL Open Font License 1.1. Original copyright/license included as `public/assets/licenses/courier-prime-OFL.txt`.
- **File:** `public/assets/fonts/courier-prime-bold.ttf`, unmodified. Regular was removed as unused.
- **Scope:** used by `scripts/make-cover.py` for V4 promotional covers and seen in the existing V4 video. Not loaded by gameplay. Font hashes are tracked separately under `fonts` in the asset manifest; the font is OFL, not CC0.

## Discovery and license notes

[Kenney's itch.io page](https://kenney.itch.io/kenney-game-assets) lists the All-in-1 bundle as CC0 and explains it is a collection of freely available packs. The bundle is paid; individual packs can be downloaded free from the creator's official asset pages. No bundle purchase or paid content was used. [Kenney's support page](https://kenney.nl/support) confirms commercial use is permitted; Kenney's logo is reserved and is **not** bundled.

Exact source paths, license notices and SHA-256 hashes for all bundled external assets are tracked in `public/assets/manifest.json`. Public assets and notices ship inside the HTML-game ZIP; large source archives and preview images are not included. All assets load locally, with no runtime CDN requests.

An asset being free to download does not by itself establish permission to redistribute it.
