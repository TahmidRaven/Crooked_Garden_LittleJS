# Wavedash setup

Game ID: `j979mjdw9vq5vtftw9b2v6n7198gy2w7` (public project identity).

Game page: [Play Crooked Garden on Wavedash](https://wavedash.com/games/crookedgarden).

## Features in this build

- **Garden Masters**: highest score wins, numeric display, one personal best per Wavedash player. Only a run that clears gardens 1, 2 and 3 in order is submitted. Partial gardens and losses never submit. Existing retries and rewind penalties are unchanged. This is a casual, client-submitted leaderboard, not server-verified anti-cheat.
- **First Bloom**: restore a flower.
- **Bug Gardener**: capture a bug in a closed loop.
- **Double Trouble**: capture at least two bugs in one loop.
- **The Garden Lives**: clear all three gardens in a run.
- A Top 10 leaderboard opens from the menu/results without advancing the game. A failed score upload can be retried from the final results.

`src/wavedash.js` uses the host-injected `window.Wavedash` SDK directly. There is no CDN dependency, bundled private key, cloud save, monetization or Newgrounds API in this integration. `init()` runs once after local art and the engine splash are ready, so Wavedash can reveal the game. Without the SDK, Wavedash calls are inert and its leaderboard tab is hidden; the same ZIP works on itch.io, Newgrounds and localhost. The separate **All platforms** tab remains available everywhere and uses the [Supabase global leaderboard](SUPABASE.md). On Wavedash, the native board is selected initially; players can switch to All platforms. Completed Wavedash runs automatically submit to its native board, whereas sharing to Supabase is optional on the final results.

Achievement unlocks use `setAchievement(identifier, true)`. The SDK can refuse writes while stats/achievements are loading, so unaccepted unlocks retry every two seconds, up to 30 attempts per session. Identifiers must exist in the portal. Accepted calls request immediate persistence; local mocks cannot verify the platform's server save. We do not copy achievements between accounts or upload an old local best as a new completed run.

## Finish setup in your developer account

1. **Revoke the API key previously shared in chat.** Authenticate only through the developer portal or your locally signed-in CLI. Never put developer credentials in `VITE_*`, source code, `wavedash.toml`, the upload ZIP, or GitHub.
2. Open your game in [Wavedash Developer Portal](https://wavedash.com/dev-portal). Under **Achievements → Add achievement → Import JSON**, import [`wavedash-achievements.json`](wavedash-achievements.json). It defines the four exact identifiers above, without stat dependencies. Importing updates matching identifiers; review any existing definitions first.
3. Run `npm run package`. Upload `buildDirectories/crooked-garden.zip` under **Builds → Upload new build**. Alternatively, the checked-in `wavedash.toml` points an already authenticated CLI at `dist/index.html`: run `wavedash build push` after building.
4. Preview the build **as a member of the game's team**. Startup creates/finds the `Garden Masters` leaderboard with descending sort (`1`) and numeric display (`0`). Check **Leaderboards** and ensure it is **Visible**. Boards first created by regular players default to hidden; visibility needs checking before launch.
5. Verify the real SDK: the menu appears, Top 10 loads, a first flower unlocks **First Bloom**, a catch unlocks **Bug Gardener**, and a double catch unlocks **Double Trouble**. Finish three gardens and check both the final achievement and the uploaded score in the portal. Repeat with a lower score to confirm the personal best is retained. Reload and confirm achievements persisted.
6. Test a network interruption: the game must keep running, Top 10 should offer Refresh, and an unsuccessful final upload should offer Retry. Check a signed-out player too. Verify the same ZIP still runs without Wavedash on itch.io/Newgrounds.
7. Publish the tested build and complete the store metadata in the portal. Uploading alone does **not** publish it. The jam challenge requires the game to be published/running on Wavedash with an advanced SDK feature; code and mock tests alone do not establish eligibility.

## Local checks

```sh
npm test
npm run build
env -u NODE_OPTIONS npm run test:browser
env -u NODE_OPTIONS npm run test:joystick
env -u NODE_OPTIONS npm run test:wavedash
```

The Wavedash tests use an injected mock, with no live API writes or credentials. For a real sandbox, install/authenticate the [official CLI](https://docs.wavedash.com/cli/installation), build, then run `wavedash dev` from this repository. Sandbox and production data are separate; import/check definitions in the environment you are testing.

Official references (checked October 25, 2026): [setup](https://docs.wavedash.com/sdk/setup), [achievements/import format](https://docs.wavedash.com/sdk/achievements), [leaderboards](https://docs.wavedash.com/sdk/leaderboards), [build upload](https://docs.wavedash.com/publishing/upload), [CLI configuration](https://docs.wavedash.com/cli/configuration). The SDK call pattern also matches [LittleJS's Wavedash plugin](https://github.com/KilledByAPixel/LittleJS/blob/main/plugins/wavedash.js); this project uses a small ES-module adapter rather than importing that plugin's engine-global implementation.
