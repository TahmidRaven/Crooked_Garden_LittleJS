# Crooked_Garden_LittleJS

A cozy browser puzzle prototype: move sunlight to guide a vine through a crooked garden. Weave around obstacles, collect dew and reach the sun.

Built for [LittleJS Jam 3](https://itch.io/jam/littlejs-jam), theme **ZIGZAG** (October 2–November 2, 2026). The vine's route winds between alternating obstacles. This is an early gameplay experiment, not a finished jam submission.

## Stack
- [LittleJS](https://github.com/KilledByAPixel/LittleJS) 1.28.0 — game loop, Canvas2D, input and synthesized audio.
- JavaScript ES modules, HTML/CSS and Vite.
- Code-drawn botanical visuals, with third-party assets tracked in [CREDITS.md](CREDITS.md).
- Development assistance: OpenAI Codex. Earlier concept mockups: OpenAI image generation (not shipped as game assets).

## Develop
Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. On macOS M1, use a current Safari, Chrome or Firefox.

## Controls
Move the pointer to position sunlight. Hold the mouse button or touch to grow toward it. Release to pause and plan. R restarts the garden. Space pauses growth. Collect dew to replenish growth. Reach the golden sun to bloom.

## Build and checks
```sh
npm test
npm run build
npm run preview
```

The production build is in `dist/`. Upload a ZIP containing the **contents** of dist (index.html at archive root) as a free HTML game on itch.io, then separately submit it to the jam.

## Project status
See [plan.md](plan.md) for the current plan, decisions and handoff notes. Credits and license evidence belong in [CREDITS.md](CREDITS.md). No third-party asset is covered by an implied project-wide license.
