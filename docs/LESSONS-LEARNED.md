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
