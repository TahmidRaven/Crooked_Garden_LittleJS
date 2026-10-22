# Crooked_Garden_LittleJS

A browser route-planning prototype: guide a thirsty vine through a forgotten courtyard and bring three dormant flowers back to life. This restoration experiment replaces the original sun-exit prototype, which is preserved in Git at `ecb4b8c`.

## Objective
- **Save one flower to clear:** reach a closed bud with the vine, then choose **Finish garden**.
- **Save all three for a perfect garden:** keep growing around the shelves to reach Marigold, Poppy and Aster. They can be saved in any order; numbers identify them, not a required sequence.
- Start with **580 water**. Every unit of vine length costs water. Each of two blue dew drops restores **260 water**, so detours can extend your reach.
- Reviving a flower does not give free water. The courtyard regains color and flowers visibly bloom as you restore it.
- Running out of water preserves a partial clear if you saved any flowers; saving none is a failed attempt. Collisions offer rewind, restart, or keeping the flowers already saved.
- There is no timer or leaf-maintenance mechanic. Release to plan freely. This is one test level, not a new campaign.

Built for [LittleJS Jam 3](https://itch.io/jam/littlejs-jam), theme **ZIGZAG** (October 2–November 2, 2026). The vine's route winds between alternating obstacles. This is an early gameplay experiment, not a finished jam submission.

## Stack
- [LittleJS](https://github.com/KilledByAPixel/LittleJS) 1.28.0 — game loop, Canvas2D, input and synthesized audio.
- JavaScript ES modules, HTML/CSS and Vite.
- Code-drawn botanical visuals, with third-party assets tracked in [CREDITS.md](CREDITS.md).
- Development assistance: OpenAI Codex and OpenCode (GPT-6.1 Sol). Earlier concept mockups: OpenAI image generation (not shipped as game assets).

## Develop
Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. On macOS M1, use a current Safari, Chrome or Firefox.

## Controls
Move the pointer to position sunlight. Hold the mouse button or touch to grow toward it. Release to pause and plan. Touch closed flower buds with the growing tip to revive them. Collect blue dew to replenish water.

Keyboard: focus the garden (click it or Tab to it), use arrows to move the light, and hold G to grow. Space toggles pause, Z rewinds, and R restarts. Rewind restores spent water, collected dew and revived flowers so you can try another route. The water bar measures the vine's 1,100-unit capacity; its label shows remaining units, not a percentage.

Sound is off by default. Use the sound button to enable the CC0 music and synthesized effects; see the artist credits below.

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

The browser checks exercise partial clears and full restoration through real pointer input, flower restoration after rewind, collision/restart, pause, music, mobile touch, and input response within 100 ms of simulated game time. Layout checks cover 11 viewports from 320×568 portrait and 568×320 landscape through tablet, laptop and desktop sizes: no page overflow, no distorted board, and essential controls inside the viewport. Simulation tests also verify frame-rate-independent growth, steering response, collision substeps, water exhaustion, collectible rules, and that dew is necessary for the tested full-restoration route. Screenshots are saved in `artifacts/`. If Node is configured with `NODE_OPTIONS=--no-experimental-fetch`, run Playwright commands with `NODE_OPTIONS=''` (for example, `env NODE_OPTIONS='' npm run test:browser`).

## Project status
See [plan.md](plan.md) for the current plan, decisions and handoff notes. Credits and license evidence belong in [CREDITS.md](CREDITS.md). No third-party asset is covered by an implied project-wide license.
