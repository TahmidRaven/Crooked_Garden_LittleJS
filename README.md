# Crooked_Garden_LittleJS

A browser arcade prototype: steer a thirsty vine through a forgotten courtyard, dodge roaming thorn bugs, and bring three dormant flowers back to life. Direct hold-to-grow steering is restored; the rejected three-light planning experiment has been removed. The pre-bug version is preserved in checkpoint `14a89ae`; the original sun-exit prototype is at `ecb4b8c`.

## Objective
- **Save one flower to clear:** reach a closed bud with the vine, then choose **Finish garden**.
- **Save all three for a perfect garden:** keep growing around the shelves to reach Marigold, Poppy and Aster. They can be saved in any order; numbers identify them, not a required sequence.
- Start with **580 water**. Every unit of vine length costs water. Each of two blue dew drops restores **260 water**, so detours can extend your reach.
- Reviving a flower does not give free water. The courtyard regains color and flowers visibly bloom as you restore it.
- Running out of water preserves a partial clear if you saved any flowers; saving none is a failed attempt. Collisions offer rewind, restart, or keeping the flowers already saved.
- Two **thorn bugs patrol the gaps**. Contact with the vine tip ends the attempt unless it is protected. The bugs wait until your first growth, then keep moving even when you release.
- **Burst** costs **30 water**, lasts **0.45 seconds**, grows at **280 units/second** and stuns a bug on contact for **1.5 seconds**. It has a **2-second cooldown** and does **not** protect against shelves.
- A revived flower freezes both bugs for **0.8 seconds** and refreshes the burst cooldown, giving you a brief safe window for the next stretch.
- There is no countdown or leaf-maintenance mechanic. Use the **Pause** button or Space to freeze the world safely; releasing only stops the vine. This is one test level, not a new campaign.

Built for [LittleJS Jam 3](https://itch.io/jam/littlejs-jam), theme **ZIGZAG** (October 2–November 2, 2026). The vine's route winds between alternating obstacles. This is an early gameplay experiment, not a finished jam submission.

## Stack
- [LittleJS](https://github.com/KilledByAPixel/LittleJS) 1.28.0 — game loop, Canvas2D, input and synthesized audio.
- JavaScript ES modules, HTML/CSS and Vite.
- Code-drawn botanical visuals with CC0 Kenney bug sprites and foliage silhouettes. Source URLs, author credits and redistribution notices are in [CREDITS.md](CREDITS.md).
- Development assistance: OpenAI Codex and OpenCode (GPT-6.1 Sol). Earlier concept mockups: OpenAI image generation (not shipped as game assets).

## Develop
Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. On macOS M1, use a current Safari, Chrome or Firefox.

## Controls
Move the pointer to position sunlight. Hold the mouse button or touch to grow toward it. Release to stop the vine; watch for approaching bugs. Touch closed flower buds with the growing tip to revive them. Collect blue dew to replenish water.

Keyboard: focus the garden (click it or Tab to it), use arrows to move the light, and hold G to grow. **Shift** triggers Burst while growing. Alternatively, tap/click **Burst** to arm it for the next growth (tap again to cancel). Space or the Pause button freezes/resumes the world, Z rewinds, and R restarts. Rewind restores spent water, collected dew and revived flowers and gives a **0.9-second recovery shield**; it does not reset bug patrol time or cooldowns. Switching away from the window pauses the game automatically. The water bar measures the vine's 1,100-unit capacity; its label shows remaining units, not a percentage.

Sound is off by default. Use the sound button to enable the CC0 music and synthesized effects; see the artist credits below.

## Downloaded assets
The garden uses Kenney's **Platformer Art Deluxe** (two walking frames plus a stunned silhouette) and **Foliage Sprites** (one decorative branch). Both are CC0 and were downloaded free from the creator's official pages, linked through [Kenney's itch.io profile](https://kenney.itch.io/). The paid All-in-1 bundle was not purchased or required. The existing “calm theme” music is CC0 by [pebonius](https://pebonius.itch.io/).

Only selected files are bundled, not entire asset archives. `public/assets/manifest.json` records exact source paths, licenses and SHA-256 hashes. Notices ship in `public/assets/licenses/` and inside the itch.io ZIP. Assets load locally; optional images have procedural fallbacks if decoding fails. Browser checks require every bundled sprite to actually decode, so missing art cannot silently pass testing.

## Controls and screen fit
Growth runs at 150 world units per second, with tighter steering (16 radians/second) and a small 5-unit target dead zone. Movement uses collision substeps of at most 2 units, so the faster response cannot jump through shelves. Water still costs distance, not time: faster growth does not make a route more expensive. Arrow keys move the light at 360 units per second.

The board keeps its 5:6 aspect ratio and is sized against available viewport height. Portrait phones show objectives above the board, with water and 44-pixel-high action buttons below; short landscape screens use a compact control column. Decorative headings/instructions collapse on smaller screens instead of pushing the board below the fold. Very small windows below the supported minimum height may scroll rather than hide controls.

## Build and checks
```sh
npm test
npm run build
npx playwright install chromium --only-shell
npm run test:browser
npm run preview
npm run package
```

The production build is in `dist/`. `npm run package` creates `artifacts/crooked-garden.zip`, including credits, with index.html at the archive root. It requires the `zip` command (included on macOS). Upload this as a free HTML game on itch.io, then separately submit it to the jam. Packaging does not upload or submit anything.

The browser checks exercise direct steering, queued and timed bursts, bug stuns, full/partial restoration, rewind, pause/world freeze, touch and audio. Layout checks cover 11 viewports from 320×568 portrait and 568×320 landscape through tablet, laptop and desktop sizes: no page overflow, no distorted board, and essential controls inside the viewport. Simulation tests verify burst costs/cooldowns/protection, bug collisions, bloom safety windows, frame-rate-independent growth and shelf collision safety. A regression test shows the same route failing on a bug without Burst and restoring all three flowers with a timed Burst. Screenshots are saved in `artifacts/`. If Node is configured with `NODE_OPTIONS=--no-experimental-fetch`, run Playwright commands with `NODE_OPTIONS=''` (for example, `env NODE_OPTIONS='' npm run test:browser`).

## Project status
See [plan.md](plan.md) for the current plan, decisions and handoff notes. Credits and license evidence belong in [CREDITS.md](CREDITS.md). No third-party asset is covered by an implied project-wide license.
