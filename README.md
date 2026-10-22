# Crooked_Garden_LittleJS

A cozy browser puzzle prototype: move sunlight to guide a vine through a crooked garden. Weave around obstacles, collect dew and reach the sun.

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
Move the pointer to position sunlight. Hold the mouse button or touch to grow toward it. Release to pause and plan. Collect dew to replenish growth. Reach the golden sun to bloom.

Keyboard: focus the garden (click it or Tab to it), use arrows to move the light, and hold G to grow. Space toggles pause, Z rewinds, and R restarts. Rewind also restores spent growth and collected dew so you can try another route. The growth meter measures the vine's 1,100-unit capacity; gardens start partially filled.

Sound is off by default. Use the sound button to enable the CC0 music and synthesized effects; see the artist credits below.

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

The browser checks exercise all three gardens through real pointer input, collision/rewind/restart, pause, music, touch input and mobile layout. Screenshots are saved in `artifacts/`. If Node is configured with `NODE_OPTIONS=--no-experimental-fetch`, run Playwright commands with `NODE_OPTIONS=''` (for example, `env NODE_OPTIONS='' npm run test:browser`).

## Project status
See [plan.md](plan.md) for the current plan, decisions and handoff notes. Credits and license evidence belong in [CREDITS.md](CREDITS.md). No third-party asset is covered by an implied project-wide license.
