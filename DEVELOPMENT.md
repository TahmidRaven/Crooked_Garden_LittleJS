# Crooked Garden — development notes

[← Back to the README](README.md)

## [Play Crooked Garden on itch.io](https://ravendeath.itch.io/crooked-garden)

Play free in your browser—no download needed.

An **After Hours Arcade** game by [TahmidRaven](https://tahmidraven.com). The title and Credits page use the studio's original orange raven mark from FeastFury.

A full-screen browser arcade built with LittleJS. Grow a luminous vine, **close loops around bugs to capture them**, reclaim water, and wake every flower across three wild gardens. The game has a title screen, in-world HUD, pause menu, results, stage progression, score and a local best score—no website-style sidebar or framed board.

Startup shows **LittleJS's native animated engine splash** with a “Built with LittleJS” credit. A tiny inline first-paint style keeps the background dark and raw markup hidden until the application CSS and engine canvas are ready, including on refresh. The main menu stays hidden until the splash finishes and local artwork is decoded; slower loads retain the loading screen instead of exposing unfinished menus.

Built for [LittleJS Jam 3](https://itch.io/jam/littlejs-jam), theme **ZIGZAG**. This is a playable prototype, not a submitted jam entry. Recheck live rules/deadlines before publishing to the jam.

## Play

1. Press **Let it grow**.
2. Touch or click anywhere in the garden to place a floating joystick. Drag away from its centre to steer and grow. Release or centre the stick to stop growing; release also hides it.
3. Reach **all three flowers** to clear a garden. Blue dew adds **260 water**. Every stretch of vine uses water.
4. Use **Burst** to pass through bugs: it costs **30 water**, lasts **0.45 seconds**, and has a **2-second cooldown**. It does not protect against solid roots.
5. A flower briefly stuns the whole swarm and refreshes Burst. Clear all three gardens to finish a run.

Running out of water is a failed attempt even if you saved some flowers; there is no early-finish/partial-clear button. Bugs wait for your first growth, then continue moving after release. Use Pause when you need to stop the world.

### Loop-catching

Grow around a bug, then return to an older part of your own stem to close the loop. A small glowing join cue appears when you're close to enclosing a bug. Tiny curls, straight retracing and loops with no bugs do not award captures.

- **One bug:** removed for the attempt, **70 water + a refund of 75% of the loop's growth cost**, and **300 points**. The refund is capped at 240 water.
- **Two in one loop:** 140 base water + 80 combo water + the same single loop refund, and **800 points**. The loop cost is not refunded separately for each bug.
- Burst can stun a bug while you wrap around it. Captures also refresh Burst and give a short recovery shield.
- Capture rewards respect the 1,100-water capacity. An empty completed loop is not a passive trap for bugs entering later.
- Captures and their actual credited rewards survive rewind. The same bug cannot pay again; a fresh attempt resets eligibility.

The first garden's bugs share the open gap between roots, making a double catch possible without an enormous loop across terrain. This is the initial playtest focus; the existing later gardens remain, and the same capture rule works there without new controls or more levels.

### Water balance

Starting water is **720 / 760 / 800**. The first garden gets 60 extra water to give new players a little more room; later gardens are unchanged. Captures still fund extra trapping detours. For a single catch:

| Loop growth cost | Water awarded | Net loop cost |
| --- | --- | --- |
| 200 | 220 | Gain 20 |
| 280 | 280 | Break even |
| 500 | 310 | Spend 190 |

Tight successful loops nearly pay for themselves; oversized loops remain expensive because the refund stops growing at 240. Burst activation still costs 30 water and is not refunded. Plan catches while you have enough water to finish them: the reward arrives on closure, not before. Empty loops give nothing, captures pay once per bug, and the 1,100-water cap/rewind anti-farming rules still apply. This is a first tuning pass, not a claim that difficulty is settled.

### In-game How to Play

Steering, catching and Burst use short GIFs recorded through actual game controls, with pauses between loops. **Pause clips** switches to stills; reduced-motion users start with stills. Clips stop when leaving the guide. To regenerate: build, run `env NODE_OPTIONS='' node scripts/capture-help-motion.mjs`, then `python3 scripts/encode-help-motion.py`, then rebuild. Raw frames stay in ignored `artifacts/`; the three optimized GIFs and hash/size metadata ship in `public/assets/help/`.

Choose **How to Play** from the main menu or pause menu for a short visual walkthrough: place the floating joystick anywhere and drag to steer, get the flowers, catch bugs, use Burst, and pause/rewind. Four numbered sections pair text with gameplay clips, isolated flower/water close-ups and a full-width animated catch. Sections stack on mobile instead of shrinking into thumbnails. Pause/Rewind use readable control labels rather than a screenshot collage. Reward formulas and long explanations are left out; keyboard shortcuts sit in a collapsed section. The guide scrolls on small screens while Back and Start/Resume stay visible. Regenerate still-image fallbacks with `python3 scripts/crop-help-images.py` after refreshing showcase screenshots (Pillow required); crop coordinates and a source/hash manifest are retained.

Opening the guide never resets or advances a run. Back or Esc returns to the menu you came from; from Pause, **Resume Game** continues the same run. Keyboard focus stays inside the guide until it closes.

### Controls

| Action | Pointer/touch | Keyboard |
| --- | --- | --- |
| Steer / grow | Touch/click anywhere, then drag the floating stick; release or centre to stop | Arrows aim, hold **G** |
| Protected burst | Tap **Burst** to arm, then grow; tap again to cancel | **Shift** while growing |
| Pause / resume | Pause icon, then Keep growing | **Space** pauses; **Esc** toggles pause |
| Rewind | Rewind button | **Z** |
| New attempt / fresh swarm | Retry button | **R** |

Rewind restores vine/water/collectible history, grants a 0.9-second recovery shield, and costs 100 score. It does not reset enemy time or cooldowns. Retrying gives a new swarm, not an identical replay. Switching tabs automatically pauses. Sound starts off; the HUD has sound and optional browser-fullscreen controls.

The Kenney joystick is rendered at 45% opacity over the garden. Its origin stays at the initial touch/click; the knob has circular clamped travel and a neutral dead zone. Growth direction is relative to the vine tip, not an absolute target under the cursor. Desktop uses a small cream dot cursor until a drag begins; the old glowing aim target is removed. A second touch can activate Burst while steering. Release, cancellation, pause, retry and resize clear the joystick input.

Enable **♫** to hear effects. Bug/terrain hits play a short impact layered with a descending defeat sting; water exhaustion has a separate dry-out cue plus the defeat sting. Sounds trigger once per loss, respect mute, and never play on victory. They are original synthesized effects, with no extra downloads.

## A changing swarm

Each attempt gets a fresh random seed, initial positions, speeds, decision timing, and a shuffled mix of enemy behaviours:

- **Wanderers** choose new roaming destinations instead of repeating a fixed loop.
- **Hunters** turn toward the vine when it enters their range.
- **Chargers** telegraph a direction for 0.65 seconds, commit to a short lunge, then rest. Burst interrupts a charge.

Enemy motion is bounded to clear areas between roots. Earlier gardens have two distinct behaviour types; the final garden has all three. Their states and player reactions determine movement—there are no fixed sine-wave patrols. Explicit seeds are supported by the simulation for regression tests; normal play always generates a fresh one.

## Score and progression

Restore flowers, gather dew, capture bugs (especially in combos), stun distinct bugs, and preserve water. Score carries between gardens; rewind applies a penalty. A bug only awards stun credit once and capture credit once per attempt. Best score is stored locally in this browser under `crooked-garden-best-v2`; unfinished runs are not cloud-saved. Storage failures do not prevent play.

On Wavedash only, the optional host SDK also submits a completed three-garden run to **Garden Masters** and unlocks four achievements. Local best scores remain separate from online completed-run boards; old local records are never submitted. See [Wavedash setup](docs/WAVEDASH.md) for portal definitions, build upload and live verification. All hosts additionally offer a shared **All platforms** Top 10 and optional final-run submission through Supabase. Guest authentication is created only when the player chooses to share; reading rankings needs no guest account. See [Supabase setup](docs/SUPABASE.md). Neither online service blocks offline gameplay.

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
npm run test:joystick
npm run preview
npm run package
```

If Node has `NODE_OPTIONS=--no-experimental-fetch`, clear it for Playwright: `env NODE_OPTIONS='' npm run test:browser`.

The full-window Canvas2D scene scales the world without stretching it and supports high-DPI displays. The floating joystick uses screen-space drag offsets, independent of the garden camera. HUD and touch controls stay in screen space across portrait/landscape sizes. Reduced-motion settings suppress particles/ambient movement and sprite animation.

### Starting planter

The vine grows from the user-selected **compact Kenney planter (option A)** at 54 world units wide, 25% smaller than the first preview. It is based on **Kenney's CC0 Furniture Kit**. `flower-pot.png` is a high-resolution 2D render of the `plantSmall1` container, with the original plant omitted and dark soil added. It replaces the loose leafy start marker. The soil anchor maps to the existing growth root in every garden; no movement, collision or capture rules change.

Original mesh/material files are retained in `source-assets/flower-pot/`. `env NODE_OPTIONS='' npm run art:pot` regenerates the image and prints its dimensions, soil anchor and hash. No 3D engine or model loading is included at runtime.

### Procedural vine visuals

`src/vine.js` draws the plant directly in Canvas2D: a smoothly tapered, shaded stem; deterministic alternating/paired leaves with gradients and veins; leaves that unfurl over 0.45 seconds; and a growing bud at the live tip. Captured loops get a circulating light accent. No extra image assets or rendering library are required.

This is render-only geometry. The raw simulation path still controls movement, collision, water and captures; the visual spline retains the exact root/tip and stays close to that path. Leaves remain stable when the path grows or the viewport changes. Rewind removes future leaves and regrowth unfurls them again. Reduced motion shows leaves fully open and disables bud breathing/circulating capture light; pause freezes leaf growth. Geometry and ribbon paths are cached outside game state.

### Flying insects

The insects use actual wing-up/wing-down fly and bee animation pairs from Kenney's CC0 [Platformer Art Deluxe](https://kenney.nl/assets/platformer-art-deluxe), not the old ladybug walking cycle. Hunters use flies; wanderers/chargers use bees, with their existing behaviour-colour rings and warnings.

`src/bug-flight.js` keeps a fixed body scale and per-frame body anchors so flapping wings do not resize or bob the entire bug. Wing cycles are offset between insects and the body banks slightly with travel direction. Insects flap while waiting for first growth, even though their AI has not started moving. Pause and stun stop the animation; reduced motion uses a static wing pose without banking. AI positions, hitboxes, stun timing and loop captures are unchanged.

Bug colours stay bright in both states. Active bugs have a soft glow; stunned bugs retain the same full-colour artwork, lose the glow, and show a dashed ring/star. There is no grey/dark stunned-sprite tint.

Hunter flies use a warm amber body instead of the original grey. The palette remap happens once at image load, preserves light wings/alpha, and leaves the source PNGs unchanged. Hunters retain their coral behaviour ring and chasing rules.

## Validation

- **81 unit tests:** existing gameplay/art/render coverage plus favicon/touch-icon packaging, animated guide GIF integrity/size limits, guide-crop provenance, studio-logo provenance, first-garden-only starting water, capped loop-cost refunds, efficient versus oversized loop economics, a single-catch detour clearing with a small water margin, point-density-independent true closure cost, failure cue selection, mute/victory guards and safe audio fallback.
- **Browser checks:** changing wing images while idle enemy positions stay fixed; an actual moving-bug double capture, combo rewards/rewind and first-garden clear; native splash/slow loading, title/play/pause/results, guide/credits, all three gardens through real input, scoring, retry variation, touch, decoded sprites, reduced motion, audio, and 11 viewport sizes from 320×568 portrait / 568×320 landscape through desktop.
- Browser tests seed the randomness source for reproducibility, while verifying that retries still get different seeds. They do not mutate game state or unlock levels through shortcuts.
- Screenshots are in ignored `artifacts/` (`vine-mobile.png`, `vine-reduced-motion.png`, `double-catch.png`, `title.png`, `how-to-play*.png`, `arcade.png`, `clear-*.png`, `game-*.png`, `mobile.png`).

## Build, credits and assets

The main menu credits the creator with a direct link to **[tahmidraven.com](https://tahmidraven.com)**. Its separate **Credits** button opens an in-game page listing external art/music, their creators and source pages, CC0 notices, engine/tools, and development assistance. It does not send players to the project GitHub page. The page works within the packaged game; license notices and the source/hash manifest are bundled locally.

Production files are in `dist/`. `npm run package` creates `buildDirectories/crooked-garden.zip` with `index.html` at its root, asset notices and `CREDITS.md`. It requires `zip` (included on macOS). Packaging does not upload or submit anything.

Kenney's **Platformer Art Deluxe** bug frames, **Foliage Sprites** branch and **Furniture Kit** planter, plus pebonius's **calm theme**, are CC0. Only selected files are bundled; no paid bundle was purchased. Exact sources, changes, licenses and SHA-256 hashes are in [CREDITS.md](CREDITS.md), `public/assets/manifest.json` and `public/assets/licenses/`. Assets load locally with procedural image fallbacks; tests require all bundled art to decode successfully.

Stack: LittleJS 1.28.0, JavaScript ES modules, Canvas2D and Vite. Development assistance: OpenAI Codex and OpenCode (GPT-6.1 Sol). Earlier generated concept images are not bundled.
