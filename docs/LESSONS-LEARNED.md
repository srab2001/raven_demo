# Lessons learned

## Vercel Node function crash: ESM-only dependency survives a `"type": "module"` fix

**Symptom:** After the Google OAuth + admin-approval feature shipped,
production started returning `FUNCTION_INVOCATION_FAILED` — Vercel's
generic "This Serverless Function has crashed" page — on
`/api/auth/google/start` and related `/api/*` routes. The function logs
showed `Cannot use import statement outside a module`. The Vercel build
itself reported `Ready` every time; only the deployed function crashed at
request time.

**First two causes found (not the real bug, but real bugs):**

1. `lib/db.ts` threw at module-import time when `DATABASE_URL` was
   missing. Any function that imported it crashed before its own
   `try/catch` could ever run.
2. `/api/auth/google/start` had no `try/catch` around
   `buildGoogleAuthUrl()`, which throws if `GOOGLE_CLIENT_ID` is missing.

Both were straightforward: lazy-initialize the DB client inside a
`getClient()` function called only when actually needed, and wrap every
API handler body in `try/catch` (formalized later as a shared
`withErrorHandling` wrapper). Fixing these did **not** fix the crash.

**The misleading fix:** the `Cannot use import statement outside a
module` message pointed at a classic Node ESM/CommonJS mismatch, so the
obvious fix was adding `"type": "module"` to the root `package.json`. This
deployed cleanly and looked fixed. On the *next* fresh, no-build-cache
redeploy, the identical crash came back — same error, new deployment ID.
That recurrence is the key signal: if a module-format fix "works" once but
the same crash reappears on a later deploy with no code change to the
module config, the config isn't the actual lever being pulled.

**Root cause:** the project used `jose` for JWT signing/verification.
`jose` ships ESM-only. Vercel's monorepo Node-function bundling was not
reliably propagating the `"type": "module"` signal from the root
`package.json` into the actual runtime context of the deployed function —
so despite the repo's TypeScript compiling to what looked like the right
format, the bundled function's real runtime disagreed with it depending on
caching and bundling internals that were never fully observable from
outside Vercel's build pipeline.

**Actual fix:** stop trying to make the bundler agree with the dependency,
and remove the dependency instead. `lib/jwt.ts` was rewritten from scratch
using only the Web Crypto API (`crypto.subtle`, `TextEncoder`/
`TextDecoder`, `btoa`/`atob`) — zero third-party imports, zero
Node-specific APIs. This has two properties that matter:

- Web Crypto behaves identically whether the surrounding code is compiled
  to CommonJS or ESM, so it's inert to whatever the bundler decides.
- It also runs unmodified in Vercel's Edge Runtime (used by
  `middleware.ts`), which has no `node:crypto` — so this fix didn't trade
  one runtime-incompatibility bug for another.

`tsconfig.json`'s `"module"` was set back to `CommonJS` and
`"type": "module"` was reverted out of `package.json`, restoring the
project to a single, unambiguous module format end to end.

**How the fix was verified** (not just assumed from a green build):

- Compiled with `tsc -p tsconfig.json --outDir <tmp>` and inspected the
  actual emitted JS — confirmed `require()`/`exports.default` and zero
  `import`/`export` statements.
- Unit-tested the new crypto code directly: HS256 sign/verify roundtrip,
  wrong-secret rejection, tampered-token rejection, expired-token
  rejection, and the full Google ID token verification path (valid, wrong
  audience, wrong issuer, expired, unknown `kid`) against a locally
  generated RSA keypair with `fetch` stubbed to serve a fake JWKS.
- Confirmed on production: `/api/auth/google/start` returned a clean `302`
  redirect (not a `500`), with the deployment's `Branch` field showing
  `main`.

**Takeaways for next time:**

- A "Ready" Vercel build status proves the build succeeded, not that the
  deployed function runs. Runtime behavior has to be checked separately.
- If a serverless function throws `Cannot use import statement outside a
  module` and a `"type": "module"` / `tsconfig` module-format change seems
  to fix it but the same crash reappears on a later, cache-clean deploy —
  don't keep tuning the module config. Check whether an ESM-only
  dependency is in the dependency graph of that function and consider
  replacing it with a runtime-agnostic implementation (Web Crypto instead
  of a Node- or ESM-specific crypto/JWT library is a common swap).
- When a fix must work in both Vercel serverless functions and Edge
  Middleware, prefer Web APIs available in both (`crypto.subtle`, `fetch`,
  `TextEncoder`) over anything gated behind `node:`-prefixed built-ins —
  `node:crypto` fixes the Node side while breaking Edge.
- Two Vercel projects can track the same GitHub repo with completely
  separate environment variables and separate "production" branch
  bindings. Before concluding an env var is missing or a fix didn't ship,
  confirm which project's domain is actually being tested.

## Source

Discovered and fixed in [srab2001/raven_demo](https://github.com/srab2001/raven_demo)
while building Google OAuth + admin-approval gating for three demo apps.
See [docs/ADMIN_AUTH.md](../docs/ADMIN_AUTH.md) in that repo for the
feature-level writeup and troubleshooting checklist.

## "Verified" against a stale build, and a race condition hidden by it

**Context:** building the `/how-its-built` walkthrough page (a static HTML
page with inline JS, no bundler), including a live editor that saves and
resets content via the same admin API the `/admin` panel uses.

**What happened:** Playwright verification against the built `dist/`
output kept failing on the save/reset flow — the success message
(`"Saved..."`) never appeared, even though request logging showed the
mocked API call completing successfully. An hour of debugging (manual
in-page `fetch()` calls, request/response logging, checking for duplicate
element IDs) all came up clean — because the actual bug was elsewhere: the
source file (`how-its-built/index.html`) had been edited after the last
`npm run build`, so every verification run was testing the **old, unbuilt
copy** in `dist/`. `diff`-ing the source against the built copy immediately
showed they'd diverged.

Once rebuilt and re-tested against the fresh output, a second, real bug
surfaced: the save/reset handler set a success message on `#editor-result`,
then called `loadContentItems()` to refresh the dropdown — which
re-selected the current item and, as a side effect, cleared that same
success message a moment later. The success message. That real bug had
been masked by the first (test-infrastructure) bug the whole time — it
takes rebuilding before every check.

**Fixes:**

- Only clear a status/result message on a *user-initiated* action (e.g.
  changing the dropdown selection), never as a side effect of a data
  refresh that happens to run afterward. Any "briefly show success, then
  get silently overwritten" UI bug is invisible in a glance-and-move-on
  manual test but fails deterministically the moment something actually
  waits for the message and checks it.
- Re-run the build (or whatever compiles source → served output) *every
  time* before re-verifying, not just once at the start of a debugging
  session. A stale build produces confusing, misleading debug output that
  looks like it's pointing at one bug (routing, mocking, element lookup)
  when the real cause is that the fix under test was never actually
  served.

**Takeaway:** this is the same shape as the ESM/CommonJS incident above —
"the build looks fine" isn't the same claim as "the thing I'm testing
reflects my latest change." Whenever a check that should pass keeps
failing for reasons that don't add up, verify the artifact under test is
actually current before spending more time on the failure itself.
