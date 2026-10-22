# Crooked Garden — implementation plan and handoff

## User intent
Build a playable game using LittleJS for LittleJS Jam 3 (theme ZIGZAG), under this directory. Push progress to https://github.com/TahmidRaven/Crooked_Garden_LittleJS. Find free-to-use art/music online, verify permissions and credit every used asset. Keep this file current for future agents.

## Latest agreed design
Side-view cozy garden. Player moves a light; the vine grows toward it, existing stem stays fixed. Guide it around obstacles, collect dew for growth, reach sunlight. Zigzag comes from weaving between alternating obstacles. First test steering feel; leaf shading/energy is a later experiment, not implemented or proven fun. Earlier grid/Two Dots routing and forced-alternation supports are superseded experiments.

## Milestones
- [x] Recheck jam rules and engine documentation; GitHub repo exists and is empty.
- [x] Set up package manifest with LittleJS, Vite, browser tests.
- [x] First playable: pointer-controlled light, hold to grow, collisions, dew, win/retry, three levels, rewind, keyboard and touch input.
- [x] Find permissively licensed assets/music, download selected files, record original URL, creator, license and modifications in CREDITS.md. CC0 pebonius music bundled; original code-drawn art. Kenney foliage considered but not bundled.
- [x] Build, test steering/collisions/win/restart and browser load.
- [x] Commit and push first playable checkpoint (`07fa900`, pushed to `origin/main` on October 22, 2026).
- [ ] Playtest fun: responsive steering, short levels, fast restart; refine based on user feedback.
- [ ] Later: evaluate leaf shading; accessibility, touch, more levels, itch ZIP.

## Technical approach
LittleJS npm engine (pinned 1.28.0), JavaScript ES modules, Vite. Render botanical scene through engine Canvas2D context; engine owns timing/input/audio. Use code-drawn visuals where suitable. No dependency on generated mockup images. Prefer local assets; no runtime CDN. npm run dev, npm test, npm run build. Check package scripts for additional checks.

## Jam
https://itch.io/jam/littlejs-jam — must use LittleJS and be free to play in browser. Theme ZIGZAG. Submission cutoff Nov 2 2026 18:00 UTC = Nov 3 00:00 Dhaka. AI help allowed; disclose tools. No automatic jam submission is authorized. Git pushes ARE explicitly authorized.

## Current state / next agent
Resumed in OpenCode on October 22, 2026 after Codex stopped due to workspace credit exhaustion. First playable is implemented. Browser testing caught and fixed LittleJS's canvas-centering transform conflicting with the responsive layout (prevented pointer input), CSS overriding hidden buttons, and an inconsistent growth-meter maximum. Removed the nonexistent foliage image request; confirmed the bundled music exactly matches its credited CC0 source. Keyboard controls are scoped to the focused garden; reduced-motion mode suppresses particle bursts and dew bobbing.

Validation: `npm test` passes 8 simulation tests. `npm run build` passes. `env NODE_OPTIONS='' npm run test:browser` passes real-input routes through all three gardens, release/pause, collision/rewind/restart, music toggle and mobile touch/layout with no missing assets or runtime errors. Screenshots: `artifacts/desktop.png`, `artifacts/mobile.png`. Browser script uses a temporary production preview server and closes it after testing. `npm run package` creates a local itch.io ZIP; no automatic publication.

Next: have the user playtest steering and pacing before expanding mechanics. Leaf shading is still only a design idea. Improve mobile onboarding, evaluate landscape layout, and add accessibility/playtesting refinements based on feedback. Recheck live jam rules before actual submission. The user explicitly authorized pushing this playable checkpoint to `TahmidRaven/Crooked_Garden_LittleJS` on October 22, 2026. No jam submission is authorized.

Read README.md, CREDITS.md and git status before continuing. Update checkboxes and this section at each checkpoint. Avoid assuming mockups are playable levels. Do not reuse employer/Two Dots art without verified rights. All project changes belong inside this directory.
