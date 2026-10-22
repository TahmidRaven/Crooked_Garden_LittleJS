# Crooked Garden — implementation plan and handoff

## User intent
Build a playable game using LittleJS for LittleJS Jam 3 (theme ZIGZAG), under this directory. Push progress to https://github.com/TahmidRaven/Crooked_Garden_LittleJS. Find free-to-use art/music online, verify permissions and credit every used asset. Keep this file current for future agents.

## Latest agreed design
Current experiment: **direct-steering garden arcade**. The user rejected the three-light plan/launch experiment and explicitly asked to restore the previous version and make it more fun. Direct hold-to-grow controls, water, three flowers, dew, rewind and partial/perfect clears were restored from local checkpoint `14a89ae`. The planning files were removed; do not reintroduce marker placement without a new request. New challenge: two moving thorn bugs, a water-costing protected Burst, and bloom-triggered safety windows. The original three-level sun-exit version remains at `ecb4b8c`.

## Milestones
- [x] Recheck jam rules and engine documentation; GitHub repo exists and is empty.
- [x] Set up package manifest with LittleJS, Vite, browser tests.
- [x] First playable: pointer-controlled light, hold to grow, collisions, dew, win/retry, three levels, rewind, keyboard and touch input.
- [x] Find permissively licensed assets/music, download selected files, record original URL, creator, license and modifications in CREDITS.md. CC0 pebonius music bundled; original code-drawn art. Kenney foliage considered but not bundled.
- [x] Build, test steering/collisions/win/restart and browser load.
- [x] Commit and push first playable checkpoint (`07fa900`, pushed to `origin/main` on October 22, 2026).
- [x] Implement one restoration test level with three flowers, limited water, partial/perfect clears, objective UI and visual restoration.
- [x] Restore direct steering after rejecting three-light planning; implement thorn-bug patrols, Burst and bloom safety windows.
- [x] Research itch.io/creator asset sources, verify CC0 permissions, integrate Kenney walking/stunned bug sprites and foliage, and bundle credits/notices/source hashes.
- [ ] Playtest fun: responsive steering, short levels, fast restart; refine based on user feedback.
- [ ] Later: evaluate leaf shading; accessibility, touch, more levels, itch ZIP.

## Technical approach
LittleJS npm engine (pinned 1.28.0), JavaScript ES modules, Vite. Render botanical scene through engine Canvas2D context; engine owns timing/input/audio. Use code-drawn visuals where suitable. No dependency on generated mockup images. Prefer local assets; no runtime CDN. npm run dev, npm test, npm run build. Check package scripts for additional checks.

## Jam
https://itch.io/jam/littlejs-jam — must use LittleJS and be free to play in browser. Theme ZIGZAG. Submission cutoff Nov 2 2026 18:00 UTC = Nov 3 00:00 Dhaka. AI help allowed; disclose tools. No automatic jam submission is authorized. Git pushes ARE explicitly authorized.

## Current state / next agent
Resumed in OpenCode on October 22, 2026 after Codex stopped due to workspace credit exhaustion. First playable is implemented. Browser testing caught and fixed LittleJS's canvas-centering transform conflicting with the responsive layout (prevented pointer input), CSS overriding hidden buttons, and an inconsistent growth-meter maximum. Removed the nonexistent foliage image request; confirmed the bundled music exactly matches its credited CC0 source. Keyboard controls are scoped to the focused garden; reduced-motion mode suppresses particle bursts and dew bobbing.

Responsiveness follow-up: the user reported both sluggish controls and poor screen fit. Growth increased from 74 to 150 units/second; steering increased from 4.5 to 16 radians/second; target dead zone reduced from 10 to 5. Distance-based water costs are unchanged. Movement now uses <=2-unit substeps, capped at 50ms of elapsed simulation per update. Arrow-key light movement increased from 210 to 360 units/second. Pointer press/release updates the status immediately. CSS was rewritten into readable viewport-aware layouts: compact desktop sidebar, board-first portrait phone, short landscape control column, 44px controls and preserved board aspect ratio. Extra headings collapse before they crowd out gameplay; supported sizes no longer require page scrolling.

Arcade implementation: `src/arcade.js` layers patrols and Burst over the original pure growth simulation. Patrols begin on first growth and continue after release. Burst costs 30 water, lasts .45s, grows at 280 units/s, has a 2s cooldown, and stuns a contacted bug for 1.5s. It cannot cross shelves. A flower stuns both bugs for .8s and refreshes cooldown. Burst can be armed/cancelled by tapping the button, or triggered via Shift while growing. Rewind gives .9s recovery protection without resetting patrol time/cooldowns. Space/header Pause freezes all gameplay, and blur/hidden-tab pauses automatically. No countdown or leaf-maintenance mechanic.

Asset follow-up: user requested online/itch.io asset research and a GitHub push when finished. Kenney's itch.io bundle page and official individual pack pages confirm CC0; the paid bundle was not used. Selected four PNGs: three ladybug walking/hit sprites from Platformer Art Deluxe and one branch silhouette from Foliage Sprites. `src/art.js` loads them locally, tints the branch/hit silhouette, and supports procedural fallbacks. Original PNG bytes are unchanged. `CREDITS.md`, `public/assets/licenses/` and `public/assets/manifest.json` document creator/source URLs, notices, modifications and hashes. No runtime CDN. No logo or unrelated pack contents are bundled.

Current validation: `npm test` passes 27 tests (16 core + 10 arcade + asset provenance/hash validation). A regression fixture follows the same route with/without a timely Burst: without it, a bug catches the tip; with it, all three flowers bloom with water remaining and at least one bug stunned. `npm run build` and `env NODE_OPTIONS='' npm run test:browser` pass. Browser checks require all four PNGs to decode successfully, then cover direct steering, arming/cancelling Burst, a timed Shift burst during a winning route, bug stun, world pause, full/partial results, rewind, touch and audio. The 11 viewport checks remain: 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, 568×320, 667×375, 844×390. Board, Burst, finish, pause and secondary controls fit without page scrolling or stretching. Screenshots are in `artifacts/`; browser preview closes after testing. `npm run package` creates a local ZIP without publishing it.

Next: user playtest of direct-steering arcade feel, bug pacing and Burst timing. Solvability is not proof of fun. Tune these before expanding the level count. The three-light puzzle was explicitly disliked; do not return to it. Leaf shading remains an unused idea. Recheck live jam rules before actual submission. The user explicitly authorized publishing the arcade/asset update to `TahmidRaven/Crooked_Garden_LittleJS` on `main`. Checkpoint `14a89ae` preserves the earlier direct-steering version. No jam submission is authorized.

Read README.md, CREDITS.md and git status before continuing. Update checkboxes and this section at each checkpoint. Avoid assuming mockups are playable levels. Do not reuse employer/Two Dots art without verified rights. All project changes belong inside this directory.
