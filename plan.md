# Crooked Garden — implementation plan and handoff

## User intent
Build a playable game using LittleJS for LittleJS Jam 3 (theme ZIGZAG), under this directory. Push progress to https://github.com/TahmidRaven/Crooked_Garden_LittleJS. Find free-to-use art/music online, verify permissions and credit every used asset. Keep this file current for future agents.

## Latest agreed design
The user found the original sun-exit prototype dull and lacking an objective, and asked to implement the restoration proposal. Current experiment: restore a forgotten courtyard by reaching three dormant flowers with a light-guided vine. One flower unlocks a voluntary finish/partial clear; all three is automatic perfect completion. Start with 580 water; vine length costs water and two dew detours add 260 each. Water exhaustion with any flowers saved preserves a partial clear; no flowers means failure. No timer or leaf-maintenance system. Flowers visibly bloom and courtyard color returns as objectives are completed. Numbers identify flower names, not a required collection order. The original three-level sun-exit version remains in Git at `ecb4b8c`.

## Milestones
- [x] Recheck jam rules and engine documentation; GitHub repo exists and is empty.
- [x] Set up package manifest with LittleJS, Vite, browser tests.
- [x] First playable: pointer-controlled light, hold to grow, collisions, dew, win/retry, three levels, rewind, keyboard and touch input.
- [x] Find permissively licensed assets/music, download selected files, record original URL, creator, license and modifications in CREDITS.md. CC0 pebonius music bundled; original code-drawn art. Kenney foliage considered but not bundled.
- [x] Build, test steering/collisions/win/restart and browser load.
- [x] Commit and push first playable checkpoint (`07fa900`, pushed to `origin/main` on October 22, 2026).
- [x] Implement one restoration test level with three flowers, limited water, partial/perfect clears, objective UI and visual restoration.
- [ ] Playtest fun: responsive steering, short levels, fast restart; refine based on user feedback.
- [ ] Later: evaluate leaf shading; accessibility, touch, more levels, itch ZIP.

## Technical approach
LittleJS npm engine (pinned 1.28.0), JavaScript ES modules, Vite. Render botanical scene through engine Canvas2D context; engine owns timing/input/audio. Use code-drawn visuals where suitable. No dependency on generated mockup images. Prefer local assets; no runtime CDN. npm run dev, npm test, npm run build. Check package scripts for additional checks.

## Jam
https://itch.io/jam/littlejs-jam — must use LittleJS and be free to play in browser. Theme ZIGZAG. Submission cutoff Nov 2 2026 18:00 UTC = Nov 3 00:00 Dhaka. AI help allowed; disclose tools. No automatic jam submission is authorized. Git pushes ARE explicitly authorized.

## Current state / next agent
Resumed in OpenCode on October 22, 2026 after Codex stopped due to workspace credit exhaustion. First playable is implemented. Browser testing caught and fixed LittleJS's canvas-centering transform conflicting with the responsive layout (prevented pointer input), CSS overriding hidden buttons, and an inconsistent growth-meter maximum. Removed the nonexistent foliage image request; confirmed the bundled music exactly matches its credited CC0 source. Keyboard controls are scoped to the focused garden; reduced-motion mode suppresses particle bursts and dew bobbing.

Responsiveness follow-up: the user reported both sluggish controls and poor screen fit. Growth increased from 74 to 150 units/second; steering increased from 4.5 to 16 radians/second; target dead zone reduced from 10 to 5. Distance-based water costs are unchanged. Movement now uses <=2-unit substeps, capped at 50ms of elapsed simulation per update. Arrow-key light movement increased from 210 to 360 units/second. Pointer press/release updates the status immediately. CSS was rewritten into readable viewport-aware layouts: compact desktop sidebar, board-first portrait phone, short landscape control column, 44px controls and preserved board aspect ratio. Extra headings collapse before they crowd out gameplay; supported sizes no longer require page scrolling.

Current validation: `npm test` passes 16 simulation tests for restoration objectives, water budgets, collisions, rewind, collectible rules, steering/growth response within 100ms, equivalent growth at 30/60/120 updates per second and slow-frame collision safety. `npm run build` passes. `env NODE_OPTIONS='' npm run test:browser` passes real-input partial finish, objective rewind/reset, full restoration via both dew drops, release/pause, collision/restart, music toggle and mobile touch/finish, with no missing assets or runtime errors. A regression test confirms the same full-route plan cannot revive all three without dew. Layout assertions cover 11 viewports: 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, 568×320, 667×375 and 844×390. All keep board and essential controls visible without page scrolling or stretching. Screenshots: `artifacts/desktop.png`, `artifacts/restoring.png`, `artifacts/restored.png`, `artifacts/mobile.png`, `artifacts/layout-390x844.png`, `artifacts/layout-1280x720.png`, `artifacts/layout-844x390.png`. Browser script uses a temporary production preview server and closes it after testing. `npm run package` creates a local itch.io ZIP; no automatic publication.

Next: have the user playtest the faster steering and viewport layout, then restoration objectives/water routing before adding more levels. Test whether dew detours and partial/perfect clears create interesting choices; do not assume that automated solvability proves fun. Leaf shading is still only a design idea. Add accessibility/playtesting refinements based on feedback. Recheck live jam rules before actual submission. The user explicitly authorized the earlier playable checkpoint push to `TahmidRaven/Crooked_Garden_LittleJS` on October 22, 2026. The restoration and responsiveness updates are local and not yet pushed. No jam submission is authorized.

Read README.md, CREDITS.md and git status before continuing. Update checkboxes and this section at each checkpoint. Avoid assuming mockups are playable levels. Do not reuse employer/Two Dots art without verified rights. All project changes belong inside this directory.
