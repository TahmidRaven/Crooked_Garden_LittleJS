# Crooked Garden — implementation plan and handoff

## User intent
Build a playable game using LittleJS for LittleJS Jam 3 (theme ZIGZAG), under this directory. Push progress to https://github.com/TahmidRaven/Crooked_Garden_LittleJS. Find free-to-use art/music online, verify permissions and credit every used asset. Keep this file current for future agents.

## Latest agreed design
Side-view cozy garden. Player moves a light; the vine grows toward it, existing stem stays fixed. Guide it around obstacles, collect dew for growth, reach sunlight. Zigzag comes from weaving between alternating obstacles. First test steering feel; leaf shading/energy is a later experiment, not implemented or proven fun. Earlier grid/Two Dots routing and forced-alternation supports are superseded experiments.

## Milestones
- [x] Recheck jam rules and engine documentation; GitHub repo exists and is empty.
- [x] Set up package manifest with LittleJS, Vite, browser tests.
- [ ] First playable: pointer-controlled light, hold to grow, collisions, dew, win/retry, several levels.
- [ ] Find permissively licensed assets/music, download selected files, record original URL, creator, license and modifications in CREDITS.md.
- [ ] Build, test steering/collisions/win/restart and browser load.
- [ ] Commit and push first playable checkpoint.
- [ ] Playtest fun: responsive steering, short levels, fast restart; refine based on user feedback.
- [ ] Later: evaluate leaf shading; accessibility, touch, more levels, itch ZIP.

## Technical approach
LittleJS npm engine (pinned 1.28.0), JavaScript ES modules, Vite. Render botanical scene through engine Canvas2D context; engine owns timing/input/audio. Use code-drawn visuals where suitable. No dependency on generated mockup images. Prefer local assets; no runtime CDN. npm run dev, npm test, npm run build. Check package scripts for additional checks.

## Jam
https://itch.io/jam/littlejs-jam — must use LittleJS and be free to play in browser. Theme ZIGZAG. Submission cutoff Nov 2 2026 18:00 UTC = Nov 3 00:00 Dhaka. AI help allowed; disclose tools. No automatic jam submission is authorized. Git pushes ARE explicitly authorized.

## Current state / next agent
Implementation in progress. Read README.md, CREDITS.md and git status before continuing. Update checkboxes and this section at each checkpoint. Avoid assuming mockups are playable levels. Do not reuse employer/Two Dots art without verified rights. All project changes belong inside this directory.
