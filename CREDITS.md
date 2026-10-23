# Credits and asset provenance

- **Game design/development:** [TahmidRaven](https://tahmidraven.com), assisted by OpenAI Codex and OpenCode (GPT-6.1 Sol).
- **Studio:** After Hours Arcade. Orange raven mark reused unchanged from the owner's [FeastFury branding](https://github.com/TahmidRaven/FeastFury/blob/5994a9565971c66801405bfe3eb5004e64c4f2ca/assets/FeastFury/UI/raven.png), at their request. Bundled as `public/assets/art/after-hours-arcade.png`. Studio branding is not licensed as part of the third-party CC0 packs; source and SHA-256 are recorded separately in the asset manifest.
- **Engine:** LittleJS, Frank Force / KilledByAPixel, MIT. Installed package includes its license. https://github.com/KilledByAPixel/LittleJS
- **Build tooling:** Vite (MIT); see installed package license.
- **Initial visuals:** original procedural Canvas2D drawings made for this project.
- **How to Play illustrations:** cropped from this game's real showcase screenshots (including the credited Kenney art below); no external tutorial images. Flower/water close-ups are arranged side by side with circular masks; wider loop crops preserve gameplay context. Reproduction: `scripts/crop-help-images.py`; source screenshots, sizes and SHA-256 hashes: `public/assets/help/manifest.json`.
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

## Discovery and license notes

[Kenney's itch.io page](https://kenney.itch.io/kenney-game-assets) lists the All-in-1 bundle as CC0 and explains it is a collection of freely available packs. The bundle is paid; individual packs can be downloaded free from the creator's official asset pages. No bundle purchase or paid content was used. [Kenney's support page](https://kenney.nl/support) confirms commercial use is permitted; Kenney's logo is reserved and is **not** bundled.

Exact source paths, license notices and SHA-256 hashes for all bundled external assets are tracked in `public/assets/manifest.json`. Public assets and notices ship inside the HTML-game ZIP; large source archives and preview images are not included. All assets load locally, with no runtime CDN requests.

An asset being free to download does not by itself establish permission to redistribute it.
