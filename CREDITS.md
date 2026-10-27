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
- **Changes:** source PNG unchanged; tinted sage green at runtime, mirrored, scaled and drawn translucently around the courtyard edges. Decorative only, not collision geometry.
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

## On-screen joystick — Kenney

- **Pack:** [Mobile Controls](https://kenney.nl/assets/mobile-controls), by Kenney.
- **License:** CC0 1.0 Universal, verified on the official page and archive's `License.txt`, October 24, 2026. Notice included as `public/assets/licenses/kenney-mobile-controls.txt`.
- **Download:** https://kenney.nl/media/pages/assets/mobile-controls/0d047b3be4-1754738457/mobile-controls-1.zip
- **Files:** `Sprites/Style C/Large (2×)/joystick_circle_pad_a.png` and `Sprites/Style B/Large (2×)/joystick_circle_nub_a.png` → `public/assets/art/joystick-pad.png` and `joystick-nub.png`.
- **Changes:** original PNGs unchanged; scaled, partially transparent and subtly sepia-tinted with CSS. Hashes and exact source paths are recorded in the asset manifest.

## Wooden interface frames — Kenney

- **Pack:** [UI Pack - Adventure](https://kenney.nl/assets/ui-pack-adventure), by Kenney. The archive identifies version 1.1.
- **License:** CC0 1.0 Universal, verified on the official asset page and the archive's `License.txt`, October 27, 2026. Bundled notice: `public/assets/licenses/kenney-ui-adventure.txt`.
- **Download:** https://kenney.nl/media/pages/assets/ui-pack-adventure/9a877376bc-1723597274/kenney_ui-pack-adventure.zip
- **Files:** `Vector/panel_brown_dark_corners_a.svg`, `panel_brown_corners_a.svg`, `panel_brown_dark.svg`, `round_brown.svg` → the four `public/assets/ui/adventure-*.svg` files.
- **Changes:** source SVGs unchanged; rectangular frames use CSS nine-slice scaling, round controls scale uniformly. Hover/press brightness changes are applied with CSS. No Kenney logo is included. Exact original paths and hashes are in the asset manifest.

## Interface typeface — Courier Prime

- **Font:** [Courier Prime](https://github.com/quoteunquoteapps/CourierPrime), by The Courier Prime Project Authors.
- **Source:** [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/courierprime), `CourierPrime-Regular.ttf` and `CourierPrime-Bold.ttf`, downloaded October 27, 2026.
- **License:** SIL Open Font License 1.1. Original copyright/license included as `public/assets/licenses/courier-prime-OFL.txt`.
- **Files:** `public/assets/fonts/courier-prime-regular.ttf` and `courier-prime-bold.ttf`. Unmodified, loaded locally with `@font-face`; no runtime font CDN.
- **Scope:** Game title, interface text and gameplay reward popups, with system-font fallbacks for missing symbol glyphs. The engine's own native splash branding is unchanged. The Adventure archive does not include/name the sample font, so Courier Prime is a close typewriter-style match, not a claim of an exact match. Font hashes are tracked separately under `fonts` in the asset manifest; these font files are OFL, not CC0. Earlier promotional covers/video retain their original lettering.

## Discovery and license notes

[Kenney's itch.io page](https://kenney.itch.io/kenney-game-assets) lists the All-in-1 bundle as CC0 and explains it is a collection of freely available packs. The bundle is paid; individual packs can be downloaded free from the creator's official asset pages. No bundle purchase or paid content was used. [Kenney's support page](https://kenney.nl/support) confirms commercial use is permitted; Kenney's logo is reserved and is **not** bundled.

Exact source paths, license notices and SHA-256 hashes for all bundled external assets are tracked in `public/assets/manifest.json`. Public assets and notices ship inside the HTML-game ZIP; large source archives and preview images are not included. All assets load locally, with no runtime CDN requests.

An asset being free to download does not by itself establish permission to redistribute it.
