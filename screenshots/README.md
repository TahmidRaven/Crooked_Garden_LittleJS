# Showcase screenshots

## Itch page banner and background

See [`itch-page/`](itch-page/) for the 1260×300 banner, 1920×1080 page background, and matching Embed BG/theme colours. Reproduce with `python3 scripts/make-itch-page.py`.

## Itch cover

- `cover-v3-630x500.png` — new no-loop key-art cover: tilted title, larger bloom and flying bugs, winding vine, mossy shelf, forest light and foreground foliage.
- `cover-v3-1260x1000.png` — 2× master of the no-loop cover.

- `cover-v2-630x500.png` — new alternative: a flowing, organic lasso around both bugs, without capture text or heavy glow.
- `cover-v2-1260x1000.png` — 2× master of the new alternative.

The generator now produces the v3 no-loop alternative. Earlier covers are retained for comparison.

- `cover-630x500.png` — recommended itch cover upload.
- `cover-1260x1000.png` — 2× master of the same cover.

The cover is composed promotional artwork, not a gameplay screenshot: original vine/flower/forest shapes, the game's credited Kenney sprites, and After Hours Arcade's raven mark. Hunter colours match the game. Regenerate with `python3 scripts/make-cover.py` (Pillow; uses local Arial Rounded Bold on macOS, DejaVu Sans Bold fallback on Linux).

The vine reconnects to its older horizontal stem at the bright join ring, enclosing both bugs. The glow and DOUBLE CATCH label depict the capture moment.

## Gameplay captures

Captured from the current game through browser pointer/keyboard controls, using reproducible swarm seeds (44 for the capture run, 99 for the two-flower/live-bug run). Gameplay state was not injected, and no bugs were pasted into the originals. Originals are captured at 2× resolution.

- `01-title.png` — title screen with the original After Hours Arcade raven logo.
- `02-double-catch.png` — two bugs captured in one loop, first flower restored, reward visible.
- `03-garden-progress.png` — two flowers restored after the catch, with a water pickup and the winding route visible.
- `04-mobile-progress.png` — the same run in a 390×844 mobile viewport.
- `05-garden-restored.png` — first garden completed after catching both bugs.
- `06-phone-emulator-mockup.png` — optional presentation: mobile progression with visible bugs inside an illustrated generic phone frame.
- `07-desktop-window-mockup.png` — optional presentation: visible bugs just before a capture inside an illustrated desktop-window frame.
- `08-bugs-before-capture.png` — one flower restored, a winding vine, and both live bugs just before the capture; recommended lead gameplay image.
- `09-progress-with-bugs.png` — two flowers restored and both bugs visibly stunned by the bloom.
- `10-mobile-with-bugs.png` — mobile version of the two-flower/live-bug run.

The two mockups are composites, not photographs or screenshots of a native app/device emulator. All other PNGs are unframed game screenshots. No external device-frame assets are used.

Regenerate after `npm run build` with `env NODE_OPTIONS='' node scripts/capture-showcase.mjs`, then `python3 scripts/frame-screenshots.py` (Pillow required for the optional mockups).

How to Play uses small crops of these originals. After refreshing the screenshots, also run `python3 scripts/crop-help-images.py` to refresh the bundled guide images and their source hashes, then rebuild the game.
