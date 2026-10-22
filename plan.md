# Crooked Garden — plan and handoff

## User intent and current direction

Build a LittleJS Jam 3 game, theme ZIGZAG. Keep this handoff current, credit licensed assets, and push progress to https://github.com/TahmidRaven/Crooked_Garden_LittleJS. No automatic itch.io/jam submission is authorized.

Latest feedback: the game looked like a website and bugs repeated the same pattern every time. Current rework is a **full-screen forest arcade**, not an editorial page: in-world HUD, title/play/pause/results flow, three gardens, score and local best, floating feedback, and a changing swarm. Direct hold-to-grow steering remains. Do not bring back the rejected three-light planning mechanic.

Onboarding follow-up: the user could not tell how to play and requested a How to Play button/page. Both the main menu and pause menu now open an in-game full-screen guide with an original SVG sunlight/steering diagram, first-move example, flower/water/Burst/bug rules, and keyboard/touch controls. The run stays frozen; Back/Esc returns to the originating menu without resetting progress, and the guide can explicitly start/resume play. Header/footer navigation stays visible while instructions scroll, and keyboard focus is trapped/restored correctly.

Credits follow-up: creator credit now links directly to **https://tahmidraven.com**, not the project GitHub page. A separate in-game page is visibly labeled **Credits** (the user explicitly shortened “Asset Credits” to “Credits”). It lists the game creator, Kenney bug/foliage sources and modifications, pebonius music, CC0 notices, engine/tools/jam and development assistance. Local notice/manifest links work in production. Back/Esc returns to the main menu with restored keyboard focus; reading credits does not advance/reset the game.

## Current gameplay

- Grow toward the pointer (or arrow-key light + G), avoid mossy terrain and bugs, collect dew, and restore **all three flowers** to advance. No early finish/partial victory. Water exhaustion is failure even after some flowers bloom.
- Three levels: Moonlit clearing, Overgrown terraces, Heart of the wild. Different roots, targets and dew. Two enemies in the earlier gardens, three in the final garden.
- Starting water is 660 / 760 / 800. The first garden was increased from 580 after varied encounters exposed an overly tight defensive-burst budget.
- Burst: 30 water, .45s protection, 280 units/s, 2s cooldown. It stuns contacted bugs for 1.5s, but never crosses terrain. Flowers stun the swarm for .8s and refresh cooldown. Stun credit is once per distinct bug per attempt.
- Rewind restores vine history, grants .9s recovery protection and costs 100 score. Enemy time/cooldowns do not rewind. Retry creates a new swarm. Pause/hidden-tab freezes the simulation.
- Score carries between cleared gardens; best is local browser storage only (`crooked-garden-best-v2`). No account sync or online leaderboard.

## Enemy variation — not repeated sine tracks

`createArcade({seed,stage})` accepts an explicit seed for deterministic tests; normal attempts use a fresh crypto/random seed plus a nonce. Spawn positions, speed, shuffled behaviour mix and decisions vary by attempt.

- Wanderers select new destinations and turn toward them.
- Hunters react to the current vine tip inside their detection region.
- Chargers show a .65s locked-direction telegraph, lunge, then rest. Stuns interrupt the charge.
- Enemies stay within clear rectangular regions between terrain, avoid initial flower camping when spawning, and remain dormant before first growth. There is no periodic sine-wave patrol position function.

## Code structure

- `src/game.js`: pure vine simulation, three level layouts, water/flower/dew/collision rules and rewind.
- `src/arcade.js`: seeded randomness, enemy state/steering, Burst, stuns and simulation ticking.
- `src/main.js`: title/playing/paused/help/credits/result flow, context-aware guide/credits navigation, input, score/storage, UI and effects.
- `src/scene.js`: full-window forest rendering, terrain/vine/flowers, telegraphs, sprites, particles and feedback.
- `src/view.js`: viewport/high-DPI fitting and screen-to-world input transform. The full canvas fills the screen; the 600×720 gameplay region scales proportionally within HUD-safe space.
- `src/art.js`: local CC0 images, runtime tints and procedural fallbacks.
- `index.html` / `src/style.css`: game HUD and menu overlays. No sidebar, website header/footer or framed courtyard panel.

## Assets and licenses

Kenney CC0: three ladybug walking/hit PNGs from Platformer Art Deluxe and one branch silhouette from Foliage Sprites. pebonius CC0: calm theme music. Individual packs were downloaded free from the creator's official pages after checking itch.io/official license evidence. The paid bundle was not used. No logo or unrelated archive contents are bundled.

Sources, original paths, modifications and hashes are in `CREDITS.md`, `public/assets/manifest.json`, and bundled notices under `public/assets/licenses/`. Source PNG bytes are unchanged. All runtime assets are local. No new external assets were needed for the full-screen rework.

## Validation and useful commands

- `npm test`: **31 tests** — growth/water/terrain, all garden routes, seeded variation/replay, retry seeds, hunter reactions, charge telegraph/rest, enemy bounds, Burst/stun/score rules, source license/hash checks and viewport/DPI input mapping.
- `npm run build`: production build.
- `env NODE_OPTIONS='' npm run test:browser`: real-input title/play/pause/results, main/pause How to Play (focus trap/restoration, Back/Esc, frozen run, start/resume, touch and 11 layouts), creator website URL, separate Credits page (sources/local notice availability, focus, Back/Esc, frozen state and 11 layouts), all three gardens, score/best, randomized retries, touch/keyboard bursts, audio and asset decode checks. Tests seed the randomness source for repeatability, not the game state.
- 11 viewport checks: 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, 568×320, 667×375, 844×390. No page scrolling; full-window canvas and HUD controls fit.
- Screenshots in ignored `artifacts/`: `title.png`, `how-to-play.png`, `how-to-play-mobile.png`, `asset-credits.png`, `asset-credits-mobile.png`, `arcade.png`, `clear-*.png`, `game-*.png`, `mobile.png`.
- `npm run package`: builds `artifacts/crooked-garden.zip` with credits/notices and index.html at archive root. Does not publish the game.

## Prior checkpoints / decisions

- `ecb4b8c`: original sun-exit prototype.
- `14a89ae`: earlier direct-steering flower restoration/responsiveness checkpoint.
- `9e3ec41`: published direct-steering arcade + licensed assets before the full-screen/variable-enemy rework.
- `386f07e`: full-screen forest arcade, variable enemy AI, three-garden progression, HUD and menus.
- `925ec80`: illustrated How to Play guide in the main and pause menus.
- The user disliked pure tracing, then explicitly rejected a three-light plan/launch experiment. That experiment was removed, not shipped as the current mode.
- Earlier generated mockups are not playable levels and are not shipped assets. Do not reuse employer/Two Dots art without verified rights. Leaf maintenance/shading was discussed but is not implemented.

## Next

Playtest the full-screen arcade presentation and enemy fairness, especially charge warning visibility, hunter pressure and mobile steering. Automated solvability is not proof of fun. Tune movement/pacing before adding more mechanics. Keep changes in this project, preserve unrelated user work, update this file at checkpoints, and recheck live jam rules before any submission. GitHub pushes are authorized; jam submission is not.
