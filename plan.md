# Crooked Garden — plan and handoff

## User intent and current direction

Browser-icon follow-up: added an original orange marigold on a dark green rounded background as `public/favicon.svg`, with 32px PNG/16–48px ICO fallbacks and a 180px Apple touch icon. Relative head links support itch's nested embed paths. PNG/ICO variants are reproducible with `python3 scripts/make-icons.py` (Pillow). No gameplay changes.

Cover v3: user still disliked the loop presentation and requested a more game-like cover. Created separate no-loop key art at `screenshots/cover-v3-630x500.png` plus a 2× master. Uses a tilted oversized title, larger marigold and flying bugs, a winding upward vine/mossy ledge, forest lighting and tinted foreground foliage. Kept the studio mark and prior covers. Promotional assets only; no game/build changes.

Cover v2: user disliked the angular loop and requested another cover. Added separate `screenshots/cover-v2-630x500.png` and 1260×1000 master, retaining previous exports. New spline-drawn organic lasso reconnects to older stem around both bugs; no capture label, particles or join glow. Opened the new export in Review. Promotional art only; no game/build changes.

Cover correction: user noted the initial cover did not clearly depict a proper loop capture. Revised both cover exports to trace one continuous vine from the pot to the flower, around both bugs and back onto older stem. Added a visible join ring, enclosed-area glow, conversion particles and DOUBLE CATCH feedback. Promotional artwork only; game/build unchanged.

Cover/animated-guide follow-up: created `screenshots/cover-630x500.png` for itch plus a 1260×1000 master, with large game title, studio logo, original forest/vine/flower shapes and credited real bug/planter art. Composition is promotional artwork, not a screenshot. `scripts/make-cover.py` reproduces it. How to Play now uses three small real-play GIFs (grow/capture/Burst, under 1 MB combined) with readable loop holds; Pause clips switches to stills, reduced motion starts static, leaving the guide unloads animation. Raw captured frames stay ignored; recorder/encoder and GIF/hash manifests are retained. No gameplay rules changed. Validation: 80 unit tests, full browser suite including animation toggle/reduced-motion fallback and 11 layouts, plus cover/GIF frame visual review. Local preview reopened on How to Play.

Guide-layout correction: user found the first crop/card treatment poor. Reworked How to Play into four numbered, full-width walkthrough sections with text beside generously sized imagery, isolated/labeled flower-water details, larger contextual before/after loop panels and mobile stacking. Removed the old button collage in favour of readable Pause/Rewind labels. Five derived PNGs now ship; no forced image heights/letterboxed uniform cards. Instructions stay brief and gameplay/navigation behaviour is unchanged.

Visual-guide follow-up: user requested cropped showcase images in How to Play. Replaced the generic SVG with a real pot-to-flower crop and added flower/water, before/after loop, stunned-bug and Pause/Rewind button illustrations. Kept concise instructions, collapsed keys, fixed navigation and paused-run behaviour. Crops ship as six small PNGs under `public/assets/help/`, not full-size screenshots or device mockups; reproducible via `scripts/crop-help-images.py`, with source/hash manifest and regression coverage. No gameplay changes. Validated with 79 unit tests, the full browser suite/11 viewport sizes, desktop/mobile screenshot review and packaging.

Studio-branding follow-up: user requested After Hours Arcade branding reused from their existing work before refreshing showcase images. Verified FeastFury's menu and reused its original orange raven PNG unchanged (source commit and SHA-256 in `public/assets/manifest.json`, separate from CC0 packs). Title and Credits page now show AFTER HOURS ARCADE + logo; TahmidRaven website credit remains. No extra splash delay or in-play obstruction. Add genuinely bug-visible pre-capture gameplay shots rather than compositing living enemies into a cleared arena.

Showcase screenshots: `screenshots/` contains branded title, real double catch with one flower restored, two-flower progression/water pickup, mobile progression, and first-garden completion. Added `08-bugs-before-capture.png` (live enemies, winding vine and one restored flower), `09-progress-with-bugs.png` and `10-mobile-with-bugs.png` (two restored flowers and visibly stunned bugs). Captured through actual pointer/keyboard controls with swarm seeds 44/99, not injected gameplay state or pasted enemies. Optional phone-emulator/desktop-window mockups now use the bug-visible shots; clearly identified as composites in `screenshots/README.md`. Reproduce with `scripts/capture-showcase.mjs` and `scripts/frame-screenshots.py`. Original unframed captures remain available for itch.io. No gameplay changes in this pass. Validation: 78 unit tests and full browser suite (including 11 layouts) pass; short-landscape title spacing adjusted to retain visible creator credit after adding branding.

Build a LittleJS Jam 3 game, theme ZIGZAG. Keep this handoff current, credit licensed assets, and push progress to https://github.com/TahmidRaven/Crooked_Garden_LittleJS. No automatic itch.io/jam submission is authorized.

Latest feedback: the game looked like a website and bugs repeated the same pattern every time. Current rework is a **full-screen forest arcade**, not an editorial page: in-world HUD, title/play/pause/results flow, three gardens, score and local best, floating feedback, and a changing swarm. Direct hold-to-grow steering remains. Do not bring back the rejected three-light planning mechanic.

Latest gameplay hook (user approved): **loop-catching**, keeping the same direct controls. Grow around bugs and reconnect to older stem to capture them. Current water award is **70 per bug + 75% of the loop's growth cost (refund capped at 240), plus 80 per additional bug in the same catch**. Score remains 300 per bug + 200 per additional bug. Captures remove bugs permanently for the attempt, refresh Burst and grant .45s recovery protection. A join hint, glowing enclosure, conversion particles, distinct capture/combo chimes and popup/HUD rewards make the action visible. The first garden's two enemy roaming regions overlap in the open root gap to support a realistically sized multi-catch. Later layouts are unchanged.

Loss-audio/water follow-up: user requested hit/death/loss SFX and found water too restrictive for catching bugs without wanting the game too easy. Added original synthesized impact + descending defeat sounds, and a separate dry-out cue for water loss. They respect mute, play once per failed attempt, and never on victory. Water uses the capped loop-cost refund above rather than increasing starting tanks (still 660/760/800). A 280-water single catch breaks even; a 500-water loop still costs 190 net. Empty loops give nothing and once-per-bug/cap/rewind safeguards stay intact. Catching needs water up front, so low-water HUD/result copy suggests dew and planning catches early. This is a first balance pass to playtest, not a final difficulty claim.

Vine visual follow-up (user approved): `src/vine.js` replaces uniform strokes with a render-only quadratic spline/ribbon, thick near older growth and fine at the tip, layered cylindrical shading, stable alternating/paired veined leaves with palette/size variation, .45s leaf unfurling, and a small shaded growing bud. Capture light travels around closed enclosures. Geometry/Path2D/leaf birth caches live in WeakMaps, never on simulation state. Raw paths, steering, collision, water and capture rules are untouched. Spline endpoints exactly match physics and smoothing stays within a small local hull. Rewind prunes future leaf births; reduced motion opens leaves immediately and suppresses bud breathing/capture circulation. Pause uses the frozen simulation clock for leaf animation.

Flying-bug follow-up: the user asked for online animated insects because walking ladybugs looked like they floated in mid-air. Rechecked Kenney's official CC0 Platformer Art Deluxe page and selected actual fly/bee wing-up/down pairs plus matching hit silhouettes from that same source archive. The old three ladybug files were removed. `src/bug-flight.js` supplies fixed body anchors/scale, independently offset wing cycles, species selection (hunter = fly, other behaviours = bee), slight continuous banking, and static stunned/reduced-motion poses. The renderer no longer draws a grounded shadow. Idle insects flap before their AI activates. Once moving, animation uses the simulation clock and freezes on pause/stun. No movement, capture, collision or scoring logic changed.

Flight browser regression crops the same idle insect across three frames and checks that the image changes while the complete enemy-position snapshot and simulation clock remain unchanged (`artifacts/bug-flight-0.png` through `bug-flight-2.png`). Testing exposed an old menu Shift+Tab input leaking into Burst when play began; begin/resume now clear engine input so menu keys cannot arm an ability accidentally.

Colour follow-up: the user disliked darkened bees and suggested glow/non-glow states. Stunned insects now retain their normal full-colour first flight frame instead of a tinted hit silhouette. Active bugs get a soft halo; stunned bugs lose the glow, stop flapping and show a dashed gold ring/star. The unused two hit-silhouette PNGs were removed from the bundle/manifest/loader. No AI or stun-rule changes. Comparison screenshots: `artifacts/bugs-active.png`, `artifacts/bugs-stunned.png`.

Hunter colour follow-up: the user also disliked the naturally grey hunter fly. Its neutral dark body pixels are now remapped to warm amber once at load time; light wings, coloured pixels, alpha and source PNG bytes remain unchanged. Eyes stay darker for contrast. The hunter keeps its species shape, coral ring and chasing behaviour. Three palette regression tests cover body/eye contrast, wing/colour preservation and immutable source pixels.

Starting-pot follow-up: user requested a flower-pot asset instead of the loose leafy start marker. Selected Kenney's CC0 Furniture Kit `plantSmall1` container. The source OBJ/MTL are retained unchanged in `source-assets/flower-pot/`; an offline renderer creates a high-resolution transparent 2D PNG of the container only, with dark soil added. This is derived from Kenney's existing model, not AI-generated concept art. `src/pot.js` aligns the soil anchor to the unchanged root in all gardens. The pot is rendered behind the vine, so the stem emerges from its soil. No new collider or 3D runtime is added. Guide text/diagram and in-game Credits include the pot.

Pot selection: the user found the first 72-unit preview too big, saw a comparison, and explicitly chose **A — compact Kenney planter**. Its final width is **54 world units** (25% smaller). Option B, the Techspired Minds CC BY-SA pot, was only an ignored preview and is not part of the game/source asset bundle. Keep the selected Kenney pot; do not substitute the other preview.

Onboarding follow-up: the user could not tell how to play and requested a How to Play button/page. Both the main menu and pause menu now open an in-game full-screen guide with an original SVG sunlight/steering diagram, first-move example, flower/water/Burst/bug rules, and keyboard/touch controls. The run stays frozen; Back/Esc returns to the originating menu without resetting progress, and the guide can explicitly start/resume play. Header/footer navigation stays visible while instructions scroll, and keyboard focus is trapped/restored correctly.

Copy follow-up: user requested simpler, less AI-sounding How to Play text. The guide now uses plain practical language, one short first-move example, four brief cards (flowers/water, catching, Burst, pause/rewind), and collapsed keyboard controls. Removed reward maths, behaviour taxonomy, slogans and long explanations. Kept the diagram and the important warning that releasing does not stop bugs. The help launch action says Start Game/Resume Game. Browser regression checks brevity (<200 basic words), no balance maths, shortcut expansion and existing navigation/freeze/layout behaviour. Detailed rules remain in README, not the basic player guide.

Credits follow-up: creator credit now links directly to **https://tahmidraven.com**, not the project GitHub page. A separate in-game page is visibly labeled **Credits** (the user explicitly shortened “Asset Credits” to “Credits”). It lists the game creator, Kenney bug/foliage sources and modifications, pebonius music, CC0 notices, engine/tools/jam and development assistance. Local notice/manifest links work in production. Back/Esc returns to the main menu with restored keyboard focus; reading credits does not advance/reset the game.

Startup follow-up: enable LittleJS's **actual built-in animated splash** via `setShowSplashScreen(true)`, not a recreated logo. A “Built with LittleJS” status credit remains visible during startup. Initial phase is loading, all menus stay hidden, and async engine init awaits `artReady` before showing the title. Slow assets use the engine's built-in loading screen. Branding fits below the logo on short landscape screens. No additional logo download or external runtime request is introduced.

Refresh/first-paint follow-up: the user saw raw HTML briefly before CSS loaded. `index.html` now contains critical inline background/visibility styles, preserved in the built HTML. The application adds `html.game-styled` only after CSS imports and engine canvas initialization. Do not remove this gate or move it into the external stylesheet. Browser regression checks fresh navigation and refresh with application JS disabled and external CSS unavailable: dark background, hidden markup, no raw loading text; normal startup still reveals the real splash and menu.

## Current gameplay

- Grow toward the pointer (or arrow-key light + G), avoid mossy terrain and bugs, collect dew, and restore **all three flowers** to advance. No early finish/partial victory. Water exhaustion is failure even after some flowers bloom.
- Three levels: Moonlit clearing, Overgrown terraces, Heart of the wild. Different roots, targets and dew. Two enemies in the earlier gardens, three in the final garden.
- Starting water is 720 / 760 / 800. The first garden was previously increased from 580 to 660 after varied encounters exposed an overly tight defensive-burst budget; the latest user-requested first-garden-only increase adds another 60 (about 9%). Later gardens, bugs, Burst costs and capture rewards are unchanged.
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
- `src/failure-audio.js`: original hit/dry-out/defeat ZzFX designs, reason-to-cue selection and muted/optional-output-safe playback.
- `src/arcade.js`: seeded randomness, enemy state/steering, Burst, stuns and simulation ticking.
- `src/main.js`: loading/title/playing/paused/help/credits/result flow, native engine splash and async asset readiness, context-aware guide/credits navigation, input, score/storage, UI and effects.
- `src/scene.js`: full-window forest rendering, terrain/vine/flowers, telegraphs, sprites, particles and feedback.
- `src/vine.js`: render-only taper/spline geometry, cached ribbon paths, deterministic leaf placement and unfurling, bud shading and capture light.
- `src/view.js`: viewport/high-DPI fitting and screen-to-world input transform. The full canvas fills the screen; the 600×720 gameplay region scales proportionally within HUD-safe space.
- `src/art.js`: local CC0 images, runtime tints and procedural fallbacks.
- `src/bug-flight.js`: pure flight-frame/body-anchor/banking/glow selection and the four insect art file mappings.
- `src/pot.js`: planter image dimensions, soil anchor and world placement. `scripts/render-flower-pot.mjs` regenerates the image from the retained Kenney source via `npm run art:pot` (Playwright dev dependency only).
- `index.html` / `src/style.css`: game HUD and menu overlays. No sidebar, website header/footer or framed courtyard panel.

## Assets and licenses

Kenney CC0: four full-colour fly/bee flight PNGs from Platformer Art Deluxe and one branch silhouette from Foliage Sprites. pebonius CC0: calm theme music. Individual packs were downloaded free from the creator's official pages after checking itch.io/official license evidence. Original PNG bytes are unchanged; body alignment is runtime metadata. Old walking ladybugs and dark stunned silhouettes are no longer bundled. The paid bundle was not used. No logo or unrelated archive contents are bundled.

The planter is a separate CC0 Furniture Kit derivative, documented in `CREDITS.md` and the manifest with source OBJ/MTL hashes and rendered PNG hash. Only the PNG and license notice ship in the HTML game ZIP; the two source files and renderer stay in the repository for reproducibility.

Sources, original paths, modifications and hashes are in `CREDITS.md`, `public/assets/manifest.json`, and bundled notices under `public/assets/licenses/`. Source PNG bytes are unchanged. All runtime assets are local. No new external assets were needed for the full-screen rework.

## Validation and useful commands

- `npm test`: **81 tests** — gameplay/art/render, favicon/touch-icon packaging, GIF integrity/size, guide-crop and studio-logo provenance coverage plus seven water-balance tests and four failure-audio tests. Water tests verify 720/760/800 starting tanks, tight-loop economics, the fixed cap, a single refund per multi-catch, true-crossing length independent of point density and a first-garden single-catch detour ending with 60–140 spare water (seed 20).
- `npm run build`: production build.
- `env NODE_OPTIONS='' npm run test:browser`: native LittleJS splash/branding (desktop + short landscape), deliberately delayed images proving the menu waits for readiness, real-input title/play/pause/results, main/pause How to Play (focus trap/restoration, Back/Esc, frozen run, start/resume, touch and 11 layouts), creator website URL, separate Credits page (sources/local notice availability, focus, Back/Esc, frozen state and 11 layouts), all three gardens, score/best, randomized retries, touch/keyboard bursts, audio and asset decode checks. Tests seed the randomness source for repeatability, not the game state.
- 11 viewport checks: 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, 568×320, 667×375, 844×390. No page scrolling; full-window canvas and HUD controls fit.
- Screenshots in ignored `artifacts/`: `title.png`, `how-to-play.png`, `how-to-play-mobile.png`, `asset-credits.png`, `asset-credits-mobile.png`, `arcade.png`, `clear-*.png`, `game-*.png`, `mobile.png`.
- `npm run package`: builds `artifacts/crooked-garden.zip` with credits/notices and index.html at archive root. Does not publish the game.

Vine browser checks also grow a plant in reduced-motion mode, verify the flower is collected, and compare complete simulation snapshots across paused renders. Visual examples: `artifacts/vine-mobile.png`, `artifacts/vine-reduced-motion.png`, `artifacts/arcade.png`, `artifacts/double-catch.png`. No new external assets are used by this visual pass.

Capture browser regression uses RNG seed 44 and real pointer/Shift input, not injected game state: (430,550) → (500,550) → (500,435) → (380,435) → (380,360) → (300,360) → (300,435) → (395,435). It captures both moving bugs, checks the dynamic capped refund/combo, tests permanence through rewind, then clears the remaining flowers. Screenshot: `artifacts/double-catch.png`. The main no-capture campaign uses a separate seeded sequence. Audio checks observe actual WebAudio buffer starts: muted loss produces no sound, an enabled hit starts two non-silent buffers, and the result screen does not replay them.

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
- `a082fe6`: real fly/bee wing animations and body-aligned flight poses.
- `6e3fca3`: selected compact Kenney planter (A), 54 world units wide.
- The user disliked pure tracing, then explicitly rejected a three-light plan/launch experiment. That experiment was removed, not shipped as the current mode.
- Earlier generated mockups are not playable levels and are not shipped assets. Do not reuse employer/Two Dots art without verified rights. Leaf maintenance/shading was discussed but is not implemented.

## Next

Playtest whether lassoing a bug feels satisfying and worth the growth detour, especially the first-garden double catch. Tune capture tolerance, reward balance, combo opportunities and mobile clarity before adding levels or mechanics. Automated solvability is not proof of fun. Keep changes in this project, preserve unrelated user work, update this file at checkpoints, and recheck live jam rules before any submission. GitHub pushes are authorized; jam submission is not.
