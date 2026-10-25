# Global leaderboard — Supabase

Project: `jzixrgkpvbypiyfnshjq` · `https://jzixrgkpvbypiyfnshjq.supabase.co`

## What players get

The **Leaderboard** button appears on every host. **All platforms** reads the shared Supabase Top 10. On Wavedash, a second tab shows the native Wavedash board and achievements still unlock through its SDK.

Only a complete three-garden run offers **Share global score** on the final results. Sharing is optional: choose a public name (3–24 ASCII letters, digits, spaces, `_` or `-`) and click Share. This creates an anonymous Supabase Auth user, saves its session in browser storage, and submits through an Edge Function. Merely playing or viewing scores does **not** create a user. No email, password or Wavedash account is required. Failed submissions can be retried while the results remain open.

One best score is kept per guest identity. Different sites/devices/browser profiles have separate storage, so the same human can have separate entries; this is not cross-platform account linking. Clearing browser data loses access to the guest identity. Tokens stay in this browser, are sent only to your Supabase project, and are not public leaderboard fields. Public data is limited to name, score and rank. Explain this in your published page's privacy notes.

## Status and deployment

**Deployed October 25, 2026**, with the owner's authorization, to `jzixrgkpvbypiyfnshjq`. Supabase CLI 2.122.0 was installed, the linked-project dry run reviewed, migration `202610250001_global_leaderboard.sql` applied, and `submit-garden-score` deployed. Anonymous sign-in was enabled by the owner. No billing settings were changed.

Live read/authorization checks passed: public Top 10 returned HTTP 200 with an empty array; the private table and submission RPC denied unauthenticated browser access; the Edge Function returned HTTP 401 for both missing and forged player tokens. These checks created **no test accounts or fake scores**. A real authenticated completed-run submission, authenticated-role access checks, session refresh and cross-platform iframe verification remain to be performed. Unit/browser tests use mocked endpoints separately.

### 1. Enable guest sign-in

In Supabase **Authentication → Sign In / Providers → Anonymous Sign-Ins**, enable anonymous users. Review any existing policies first: anonymous Auth users have the `authenticated` role, not the unauthenticated `anon` role. Our score tables grant neither role direct access.

Keep Supabase Auth rate limits enabled; anonymous signup normally has an IP limit (documented default: 30/hour). Signing in occurs only when a user opts to publish a score. Supabase recommends CAPTCHA for public anonymous apps; this build has **no CAPTCHA widget yet**. If CAPTCHA is enabled in your project, sign-ins will fail until a widget/token flow is added. Do not mistake per-user submission limits for protection against an attacker creating many guest accounts. Add CAPTCHA before a broad public launch if abuse is a concern. See [anonymous sign-in guidance](https://supabase.com/docs/guides/auth/auth-anonymous).

### 2. Review and apply the migration

For a new setup or future deployment, install the [official Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), then run from the repository root (the initial deployment above is already complete):

```sh
supabase login
supabase link --project-ref jzixrgkpvbypiyfnshjq
supabase db push --dry-run
```

Inspect the planned changes before applying:

```sh
supabase db push
```

`supabase/config.toml` is already included; do not re-run `supabase init` over it. The migration creates new `garden_scores`, `garden_top_scores()` and `submit_garden_score(...)` objects. If these names already exist, stop and reconcile them; do not drop existing project data. Alternatively, review and execute `supabase/migrations/202610250001_global_leaderboard.sql` in the project's SQL Editor (the CLI also records migration history).

### 3. Deploy the score endpoint

```sh
supabase functions deploy submit-garden-score --project-ref jzixrgkpvbypiyfnshjq
```

The checked-in function config disables the gateway's legacy JWT check intentionally. **The handler independently verifies the player's Bearer token with `/auth/v1/user` before any database write.** Never remove that check. The function uses the server-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment values; the service key must never enter the browser bundle or GitHub. `--no-verify-jwt` may be used if deploying outside the config-aware CLI, but only with this handler's Auth verification intact.

The project URL/publishable key in `src/global-leaderboard.js` are public browser configuration, not database credentials. The provided direct database URL was a password-placeholder example and is not stored/used by this integration. Keep actual database passwords, CLI access tokens and service-role keys out of chat, source, build ZIPs and `VITE_*` variables.

### 4. Verify before uploading the game

- Open Leaderboard from localhost: Top 10 should load as empty, not error, without creating any Auth user.
- Confirm the browser/publishable key cannot select or insert into `garden_scores`, or execute `submit_garden_score` directly. Only the fixed `garden_top_scores` projection is public. Test this with both unauthenticated and anonymous authenticated sessions.
- Finish three gardens, choose a name and Share. Confirm one anonymous Auth user and one score row are created. Refresh the leaderboard and check the entry.
- Submit a lower completed-run score in the same profile after 30 seconds: the old best must remain. A retry using the same run ID must not duplicate the score.
- Tampered scores above 10,000, malformed names, incomplete runs, missing/expired/forged JWTs and sub-10-second claimed runs must fail. A second different submission within 30 seconds returns HTTP 429.
- Verify two different browser profiles can both submit. Test the itch.io, Newgrounds and Wavedash versions against the same project; cross-origin fetch must work inside their actual game frames.
- Disconnect the network: gameplay must continue; rankings show a retry message and sharing must not falsely report success. Reload and confirm the guest session refreshes normally.

Then run `npm run package` and upload `buildDirectories/crooked-garden.zip` to your chosen hosts. Backend migrations/functions are deployed separately; they are not bundled in that ZIP. Do not re-run the initial SQL manually on the deployed project; use reviewed new migrations for future changes.

## Security and free-tier limits

- RLS is enabled and browser roles have **no direct table grants**. Public reads use a fixed security-definer Top 10 function exposing no user IDs or tokens.
- Only the Edge Function's server role can execute the submission function. It uses the user ID returned by Auth, ignoring any browser-supplied user ID.
- Atomic per-player locking, a 30-second interval and last-run idempotency prevent accidental duplicates and simple same-identity spam. The database retains a personal best, not an unbounded run history.
- Validation is **plausibility checking, not replay verification or anti-cheat**. A modified client can still claim a plausible score/duration or make new guest identities. The 10,000 ceiling is a conservative bound for current three-garden scoring (current theoretical maximum is 9,900); update it on both client/server/database if scoring changes.
- Stay on Supabase's Free plan if you want no paid subscription, monitor Auth/database/function quotas and abuse, and do not enable a paid upgrade or overages without reviewing costs. Free service has usage limits and may pause; this does not promise unlimited free availability. No billing settings were changed here.
- Anonymous Auth users need a retention/cleanup policy; there is no automatic cleanup assumed. Deleting an Auth user cascades to its score. Decide retention and moderation rules before deleting data. Remove abusive names through the dashboard as the project owner.

## Tests

`npm test` covers browser client requests, lazy guest signup/session refresh, validation, Edge Function authorization and SQL grant declarations. `env -u NODE_OPTIONS npm run test:wavedash` exercises Wavedash/native versus global tabs and an actual completed run's opt-in sharing, failures and idempotent retries with mock endpoints. These automated tests make **no requests or writes to the live Supabase project**. The separate live checks and remaining verification are listed under deployment status above.
