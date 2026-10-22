# Crooked Garden — Outgrow the swarm

A full-screen browser arcade built with LittleJS. Grow a luminous vine through three wild gardens, dodge a changing swarm, and wake every flower. The game has a title screen, in-world HUD, pause menu, results, stage progression, score and a local best score—no website-style sidebar or framed board.

Startup shows **LittleJS's native animated engine splash** with a “Built with LittleJS” credit. The main menu stays hidden until the splash finishes and local artwork is decoded; slower loads retain the loading screen instead of exposing unfinished menus.

Built for [LittleJS Jam 3](https://itch.io/jam/littlejs-jam), theme **ZIGZAG**. This is a playable prototype, not a submitted jam entry. Recheck live rules/deadlines before publishing to the jam.

## Play

1. Press **Let it grow**.
2. Hold the mouse button or touch to grow toward your pointer. Release to stop growing.
3. Reach **all three flowers** to clear a garden. Blue dew adds **260 water**. Every stretch of vine uses water.
4. Use **Burst** to pass through bugs: it costs **30 water**, lasts **0.45 seconds**, and has a **2-second cooldown**. It does not protect against solid roots.
5. A flower briefly stuns the whole swarm and refreshes Burst. Clear all three gardens to finish a run.

Running out of water is a failed attempt even if you saved some flowers; there is no early-finish/partial-clear button. Bugs wait for your first growth, then continue moving after release. Use Pause when you need to stop the world.

### In-game How to Play

Choose **How to Play** from the main menu or pause menu to open the full-screen guide. It includes a sunlight/steering diagram, a first-move example, the flower objective, water and Burst rules, enemy warnings, and mouse/touch/keyboard controls. The guide scrolls on small screens while Back and Play/Resume stay visible.

Opening the guide never resets or advances a run. Back or Esc returns to the menu you came from; from Pause, **Resume Game** continues the same run. Keyboard focus stays inside the guide until it closes.

### Controls

| Action | Pointer/touch | Keyboard |
| --- | --- | --- |
| Steer / grow | Move and hold on the world | Arrows aim, hold **G** |
| Protected burst | Tap **Burst** to arm, then grow; tap again to cancel | **Shift** while growing |
| Pause / resume | Pause icon, then Keep growing | **Space** pauses; **Esc** toggles pause |
| Rewind | Rewind button | **Z** |
| New attempt / fresh swarm | Retry button | **R** |

Rewind restores vine/water/collectible history, grants a 0.9-second recovery shield, and costs 100 score. It does not reset enemy time or cooldowns. Retrying gives a new swarm, not an identical replay. Switching tabs automatically pauses. Sound starts off; the HUD has sound and optional browser-fullscreen controls.

## A changing swarm

Each attempt gets a fresh random seed, initial positions, speeds, decision timing, and a shuffled mix of enemy behaviours:

- **Wanderers** choose new roaming destinations instead of repeating a fixed loop.
- **Hunters** turn toward the vine when it enters their range.
- **Chargers** telegraph a direction for 0.65 seconds, commit to a short lunge, then rest. Burst interrupts a charge.

Enemy motion is bounded to clear areas between roots. Earlier gardens have two distinct behaviour types; the final garden has all three. Their states and player reactions determine movement—there are no fixed sine-wave patrols. Explicit seeds are supported by the simulation for regression tests; normal play always generates a fresh one.

## Score and progression

Restore flowers, gather dew, stun distinct bugs, and preserve water. Score carries between gardens; rewind applies a penalty. A bug only awards stun credit once per attempt. Best score is stored locally in this browser under `crooked-garden-best-v2`; there is no online leaderboard or account sync. Storage failures do not prevent play.

## Develop

Node.js 20.19+ or 22.12+:

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npx playwright install chromium --only-shell
npm run test:browser
npm run preview
npm run package
```

If Node has `NODE_OPTIONS=--no-experimental-fetch`, clear it for Playwright: `env NODE_OPTIONS='' npm run test:browser`.

The full-window Canvas2D scene scales the world without stretching it, maps pointer coordinates through a tested camera transform, and supports high-DPI displays. HUD and touch controls stay in screen space across portrait/landscape sizes. Reduced-motion settings suppress particles/ambient movement and sprite animation.

## Validation

- **31 unit tests:** growth/collisions/water, all three garden routes, seeded variation and replay, reactive hunters, charge telegraphs, enemy bounds, burst rules, asset provenance/hashes, and resized/high-DPI input mapping.
- **Browser checks:** native LittleJS splash/branding, deliberately delayed asset loading and clean menu handoff, title/play/pause/results, How to Play from both menus (navigation, focus, frozen run, touch and responsive layout), all three gardens through real pointer input, scoring/best score, retry variation, keyboard/touch Burst, decoded sprites, audio, and 11 viewport sizes from 320×568 portrait / 568×320 landscape through desktop.
- Browser tests seed the randomness source for reproducibility, while verifying that retries still get different seeds. They do not mutate game state or unlock levels through shortcuts.
- Screenshots are in ignored `artifacts/` (`title.png`, `how-to-play.png`, `how-to-play-mobile.png`, `arcade.png`, `clear-*.png`, `game-*.png`, `mobile.png`).

## Build, credits and assets

The main menu credits the creator with a direct link to **[tahmidraven.com](https://tahmidraven.com)**. Its separate **Credits** button opens an in-game page listing external art/music, their creators and source pages, CC0 notices, engine/tools, and development assistance. It does not send players to the project GitHub page. The page works within the packaged game; license notices and the source/hash manifest are bundled locally.

Production files are in `dist/`. `npm run package` creates `artifacts/crooked-garden.zip` with `index.html` at its root, asset notices and `CREDITS.md`. It requires `zip` (included on macOS). Packaging does not upload or submit anything.

Kenney's **Platformer Art Deluxe** bug frames and **Foliage Sprites** branch, plus pebonius's **calm theme**, are CC0. Only selected files are bundled; no paid bundle was purchased. Exact sources, changes, licenses and SHA-256 hashes are in [CREDITS.md](CREDITS.md), `public/assets/manifest.json` and `public/assets/licenses/`. Assets load locally with procedural image fallbacks; tests require all bundled art to decode successfully.

Stack: LittleJS 1.28.0, JavaScript ES modules, Canvas2D and Vite. Development assistance: OpenAI Codex and OpenCode (GPT-6.1 Sol). Earlier generated concept images are not bundled. See [plan.md](plan.md) for decisions and the handoff.
