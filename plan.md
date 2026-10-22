# Crooked Garden — plan and handoff

## User intent and current direction

Build a LittleJS Jam 3 game, theme ZIGZAG. Keep this handoff current, credit licensed assets, and push progress to https://github.com/TahmidRaven/Crooked_Garden_LittleJS. No automatic itch.io/jam submission is authorized.

Latest feedback: the game looked like a website and bugs repeated the same pattern every time. Current rework is a **full-screen forest arcade**, not an editorial page: in-world HUD, title/play/pause/results flow, three gardens, score and local best, floating feedback, and a changing swarm. Direct hold-to-grow steering remains. Do not bring back the rejected three-light planning mechanic.

Latest gameplay hook (user approved): **loop-catching**, keeping the same direct controls. Grow around bugs and reconnect to older stem to capture them. Each bug gives 180 water + 300 score; each additional bug in the same closure adds an extra 80 water + 200 points, so a double catch pays 440 water + 800 score. Captures remove bugs permanently for the attempt, refresh Burst and grant .45s recovery protection. A join hint, glowing enclosure, conversion particles, distinct capture/combo chimes and popup/HUD rewards make the action visible. The first garden's two enemy roaming regions now overlap in the open root gap to support a realistically sized multi-catch. Existing later layouts are unchanged; the shared capture rule also works there. First-garden playtesting comes before expanding the mechanic.

Vine visual follow-up (user approved): `src/vine.js` replaces uniform strokes with a render-only quadratic spline/ribbon, thick near older growth and fine at the tip, layered cylindrical shading, stable alternating/paired veined leaves with palette/size variation, .45s leaf unfurling, and a small shaded growing bud. Capture light travels around closed enclosures. Geometry/Path2D/leaf birth caches live in WeakMaps, never on simulation state. Raw paths, steering, collision, water and capture rules are untouched. Spline endpoints exactly match physics and smoothing stays within a small local hull. Rewind prunes future leaf births; reduced motion opens leaves immediately and suppresses bud breathing/capture circulation. Pause uses the frozen simulation clock for leaf animation.

Flying-bug follow-up: the user asked for online animated insects because walking ladybugs looked like they floated in mid-air. Rechecked Kenney's official CC0 Platformer Art Deluxe page and selected actual fly/bee wing-up/down pairs plus matching hit silhouettes from that same source archive. The old three ladybug files were removed. `src/bug-flight.js` supplies fixed body anchors/scale, independently offset wing cycles, species selection (hunter = fly, other behaviours = bee), slight continuous banking, and static stunned/reduced-motion poses. The renderer no longer draws a grounded shadow. Idle insects flap before their AI activates. Once moving, animation uses the simulation clock and freezes on pause/stun. No movement, capture, collision or scoring logic changed.

Flight browser regression crops the same idle insect across three frames and checks that the image changes while the complete enemy-position snapshot and simulation clock remain unchanged (`artifacts/bug-flight-0.png` through `bug-flight-2.png`). Testing exposed an old menu Shift+Tab input leaking into Burst when play began; begin/resume now clear engine input so menu keys cannot arm an ability accidentally.

Onboarding follow-up: the user could not tell how to play and requested a How to Play button/page. Both the main menu and pause menu now open an in-game full-screen guide with an original SVG sunlight/steering diagram, first-move example, flower/water/Burst/bug rules, and keyboard/touch controls. The run stays frozen; Back/Esc returns to the originating menu without resetting progress, and the guide can explicitly start/resume play. Header/footer navigation stays visible while instructions scroll, and keyboard focus is trapped/restored correctly.

Credits follow-up: creator credit now links directly to **https://tahmidraven.com**, not the project GitHub page. A separate in-game page is visibly labeled **Credits** (the user explicitly shortened “Asset Credits” to “Credits”). It lists the game creator, Kenney bug/foliage sources and modifications, pebonius music, CC0 notices, engine/tools/jam and development assistance. Local notice/manifest links work in production. Back/Esc returns to the main menu with restored keyboard focus; reading credits does not advance/reset the game.

Startup follow-up: enable LittleJS's **actual built-in animated splash** via `setShowSplashScreen(true)`, not a recreated logo. A “Built with LittleJS” status credit remains visible during startup. Initial phase is loading, all menus stay hidden, and async engine init awaits `artReady` before showing the title. Slow assets use the engine's built-in loading screen. Branding fits below the logo on short landscape screens. No additional logo download or external runtime request is introduced.

Refresh/first-paint follow-up: the user saw raw HTML briefly before CSS loaded. `index.html` now contains critical inline background/visibility styles, preserved in the built HTML. The application adds `html.game-styled` only after CSS imports and engine canvas initialization. Do not remove this gate or move it into the external stylesheet. Browser regression checks fresh navigation and refresh with application JS disabled and external CSS unavailable: dark background, hidden markup, no raw loading text; normal startup still reveals the real splash and menu.

## Current gameplay

- Grow toward the pointer (or arrow-key light + G), avoid mossy terrain and bugs, collect dew, and restore **all three flowers** to advance. No early finish/partial victory. Water exhaustion is failure even after some flowers bloom.
- Three levels: Moonlit clearing, Overgrown terraces, Heart of the wild. Different roots, targets and dew. Two enemies in the earlier gardens, three in the final garden.
- Starting water is 660 / 760 / 800. The first garden was increased from 580 after varied encounters exposed an overly tight defensive-burst budget.
- Burst: 30 water, .45s protection, 280 units/s, 2s cooldown. It stuns contacted bugs for 1.5s, but never crosses terrain. Flowers stun the swarm for .8s and refresh cooldown. Stun credit is once per distinct bug per attempt.
- Rewind restores vine history, grants .9s recovery protection and costs 100 score. Enemy time/cooldowns do not rewind. Retry creates a new swarm. Pause/hidden-tab freezes the simulation.
- Score carries between cleared gardens; best is local browser storage only (`crooked-garden-best-v2`). No account sync or online leaderboard.
- Capture rewards are once per bug. Rewind never respawns a captured bug or pays it twice. Growth history stores a capture-credit marker so rewinding preserves only water actually credited (not nominal rewards clipped by the cap). Empty loops are consumed immediately and cannot passively catch later entrants.

## Enemy variation — not repeated sine tracks

`createArcade({seed,stage})` accepts an explicit seed for deterministic tests; normal attempts use a fresh crypto/random seed plus a nonce. Spawn positions, speed, shuffled behaviour mix and decisions vary by attempt.

- Wanderers select new destinations and turn toward them.
- Hunters react to the current vine tip inside their detection region.
- Chargers show a .65s locked-direction telegraph, lunge, then rest. Stuns interrupt the charge.
- Enemies stay within clear rectangular regions between terrain, avoid initial flower camping when spawning, and remain dormant before first growth. There is no periodic sine-wave patrol position function.

## Code structure

- `src/game.js`: pure vine simulation, three level layouts, water/flower/dew/collision rules and rewind.
- `src/loops.js`: segment intersections/near-closure, polygon area/containment, minimum-size/length guards. Closure tolerance is 8 world units; the preview cue uses 32. Tiny curls/retracing do not count.
- `src/arcade.js`: seeded randomness, enemy state/steering, Burst, stuns and simulation ticking.
- `src/main.js`: loading/title/playing/paused/help/credits/result flow, native engine splash and async asset readiness, context-aware guide/credits navigation, input, score/storage, UI and effects.
- `src/scene.js`: full-window forest rendering, terrain/vine/flowers, telegraphs, sprites, particles and feedback.
- `src/vine.js`: render-only taper/spline geometry, cached ribbon paths, deterministic leaf placement and unfurling, bud shading and capture light.
- `src/view.js`: viewport/high-DPI fitting and screen-to-world input transform. The full canvas fills the screen; the 600×720 gameplay region scales proportionally within HUD-safe space.
- `src/art.js`: local CC0 images, runtime tints and procedural fallbacks.
- `src/bug-flight.js`: pure flight-frame/body-anchor/banking selection and the six insect art file mappings.
- `index.html` / `src/style.css`: game HUD and menu overlays. No sidebar, website header/footer or framed courtyard panel.

## Assets and licenses

Kenney CC0: six fly/bee flight/hit PNGs from Platformer Art Deluxe and one branch silhouette from Foliage Sprites. pebonius CC0: calm theme music. Individual packs were downloaded free from the creator's official pages after checking itch.io/official license evidence. Original PNG bytes are unchanged; body alignment is runtime metadata. Old walking ladybugs are no longer bundled. The paid bundle was not used. No logo or unrelated archive contents are bundled.

Sources, original paths, modifications and hashes are in `CREDITS.md`, `public/assets/manifest.json`, and bundled notices under `public/assets/licenses/`. Source PNG bytes are unchanged. All runtime assets are local. No new external assets were needed for the full-screen rework.

## Validation and useful commands

- `npm test`: **59 tests** — growth/water/terrain, all garden routes, seeded variation/replay, retry seeds, hunter reactions, charge telegraph/rest, enemy bounds, Burst/stun/score rules, source license/hash checks, viewport/DPI input mapping, loop geometry/rewards/anti-farming, nine visual-vine safety tests and seven flight-art/alignment/frame/banking/stun/reduced-motion tests.
- `npm run build`: production build.
- `env NODE_OPTIONS='' npm run test:browser`: native LittleJS splash/branding (desktop + short landscape), deliberately delayed images proving the menu waits for readiness, real-input title/play/pause/results, main/pause How to Play (focus trap/restoration, Back/Esc, frozen run, start/resume, touch and 11 layouts), creator website URL, separate Credits page (sources/local notice availability, focus, Back/Esc, frozen state and 11 layouts), all three gardens, score/best, randomized retries, touch/keyboard bursts, audio and asset decode checks. Tests seed the randomness source for repeatability, not the game state.
- 11 viewport checks: 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, 568×320, 667×375, 844×390. No page scrolling; full-window canvas and HUD controls fit.
- Screenshots in ignored `artifacts/`: `title.png`, `how-to-play.png`, `how-to-play-mobile.png`, `asset-credits.png`, `asset-credits-mobile.png`, `arcade.png`, `clear-*.png`, `game-*.png`, `mobile.png`.
- `npm run package`: builds `artifacts/crooked-garden.zip` with credits/notices and index.html at archive root. Does not publish the game.

Vine browser checks also grow a plant in reduced-motion mode, verify the flower is collected, and compare complete simulation snapshots across paused renders. Visual examples: `artifacts/vine-mobile.png`, `artifacts/vine-reduced-motion.png`, `artifacts/arcade.png`, `artifacts/double-catch.png`. No new external assets are used by this visual pass.

Capture browser regression uses RNG seed 44 and real pointer/Shift input, not injected game state: (430,550) → (500,550) → (500,435) → (380,435) → (380,360) → (300,360) → (300,435) → (395,435). It captures both moving bugs, awards the combo, tests permanence through rewind, then clears the remaining flowers. Screenshot: `artifacts/double-catch.png`. The main no-capture campaign regression uses a separate seeded sequence because the first-garden swarm layout changed.

## Prior checkpoints / decisions

- `ecb4b8c`: original sun-exit prototype.
- `14a89ae`: earlier direct-steering flower restoration/responsiveness checkpoint.
- `9e3ec41`: published direct-steering arcade + licensed assets before the full-screen/variable-enemy rework.
- `386f07e`: full-screen forest arcade, variable enemy AI, three-garden progression, HUD and menus.
- `925ec80`: illustrated How to Play guide in the main and pause menus.
- `e8c6756`: creator website link and separate in-game Credits page.
- `bf58d9a`: native LittleJS startup splash and Built with LittleJS branding.
- `410ca6b`: first-paint/refresh guard; last checkpoint before loop-catching.
- `e2e8bf2`: loop captures, combo rewards, capture feedback and anti-farming.
- `33c8628`: procedural vine taper, shading, veined/unfurling leaves and a living bud.
- The user disliked pure tracing, then explicitly rejected a three-light plan/launch experiment. That experiment was removed, not shipped as the current mode.
- Earlier generated mockups are not playable levels and are not shipped assets. Do not reuse employer/Two Dots art without verified rights. Leaf maintenance/shading was discussed but is not implemented.

## Next

Playtest whether lassoing a bug feels satisfying and worth the growth detour, especially the first-garden double catch. Tune capture tolerance, reward balance, combo opportunities and mobile clarity before adding levels or mechanics. Automated solvability is not proof of fun. Keep changes in this project, preserve unrelated user work, update this file at checkpoints, and recheck live jam rules before any submission. GitHub pushes are authorized; jam submission is not.
