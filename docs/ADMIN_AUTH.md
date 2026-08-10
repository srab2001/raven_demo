# Admin panel + Google sign-in

All three demos, the landing page, and `/admin` are now gated behind Google
sign-in and admin approval. This document covers setup, the approval
workflow, and known limitations.

## Architecture

- `middleware.ts` (Vercel Edge Middleware) checks a signed session cookie on
  every request to `/`, `/demo1`, `/demo2`, `/demo3`, and `/admin`. No valid
  session → redirect to `/login`. Valid session but not an admin on `/admin`
  → redirect to `/`.
- `/api/auth/google/start` redirects to Google's OAuth consent screen.
  `/api/auth/google/callback` exchanges the code, verifies the ID token
  against Google's JWKS, upserts a row in the `users` table (Neon Postgres),
  and — if the account is approved — signs a session JWT (`jose`, HS256) into
  an httpOnly cookie.
- `/api/admin/*` (users/approve/invite/revoke) requires an admin session and
  operates on the `users` table.
- `/login`, `/pending`, and `/admin` are plain static HTML pages (no build
  step) so they don't need their own Vite app.

## Required environment variables (set in Vercel, not in the repo)

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret — **never commit this** |
| `SESSION_SECRET` | Random string (e.g. `openssl rand -base64 32`) used to sign session cookies |
| `DATABASE_URL` | Neon Postgres connection string |
| `ADMIN_EMAILS` | Comma-separated emails that auto-approve as admin on first Google login (bootstraps the first admin so nobody is locked out) |

## Google Cloud Console setup

In the OAuth 2.0 Client's settings:

- **Authorized JavaScript origin:** `https://raven-squares-build-package-1.vercel.app`
- **Authorized redirect URI:** `https://raven-squares-build-package-1.vercel.app/api/auth/google/callback`

The redirect URI is derived from the request's `Host` header at runtime, so
Google sign-in only works on domains you've registered — it will fail with
`redirect_uri_mismatch` on preview deployment URLs unless you also register
those.

## Approval workflow

1. A reviewer visits any gated page, gets redirected to `/login`, and signs
   in with Google.
2. If their email is in `ADMIN_EMAILS`, they're approved instantly as an
   admin. Otherwise a `pending` row is created and they land on `/pending`.
3. An admin opens `/admin`, sees the pending row, and clicks **Approve** (or
   invites the email in advance via the "Invite a reviewer" form, which
   pre-approves it so the very next Google login for that address succeeds
   immediately).
4. **Revoke** flips a user's status to `revoked`, blocking future logins.
   Existing sessions remain valid until they expire (see limitation below).

## Troubleshooting

**"This Serverless Function has crashed" / `FUNCTION_INVOCATION_FAILED` / a
request that shows `Status: 0` in the Vercel function logs.** This almost
always means a required environment variable is missing on *that specific*
deployment. Every `/api/*` handler in this repo now catches its own errors
(see the two fixes below), so a missing env var should show up as a clean
redirect to `/login?error=server` or a JSON `500` — not a crash. If you see
a crash, it's a regression; check the function's logs (Vercel gives you a
direct link in the error page) for the actual "X is not set" message, and
compare against the environment variable table above.

Two real crashes were found and fixed this way after the initial rollout:
`lib/db.ts` threw at module import time when `DATABASE_URL` was missing
(crashed anything touching `/api/admin/*` or `/api/auth/google/callback`),
and `/api/auth/google/start` had no `try/catch` around `buildGoogleAuthUrl()`,
which throws if `GOOGLE_CLIENT_ID` is missing.

**Multiple Vercel projects tracking one repo.** If more than one Vercel
project is connected to this GitHub repo (check the PR checks — Vercel
comments once per connected project), each one has its own, separate set of
environment variables. Setting `GOOGLE_CLIENT_ID` on one project does
nothing for the other. Confirm which project's domain you're actually
testing against before assuming an env var is "already set."

**A project's "production" tracking a branch, not `main`.** Some Vercel
projects (e.g. ones created via v0.app) can have their production
environment bound to whatever branch was last connected rather than `main`.
Check the deployment's "Branch" field in its function logs / deployment
details if production behavior seems to lag or lead what you'd expect from
`main`.

## Known limitations

- **Session TTL vs. revoke:** session cookies are valid for 7 days and
  encode role/status at sign-in time. Revoking a user blocks their *next*
  login but does not invalidate an already-issued session cookie early —
  there's no server-side session store to check per-request. Shortening the
  TTL or adding a session-invalidation table would close this gap.
- **Invite does not send email.** Inviting an address only pre-approves it
  in the database — share the demo link with them yourself. Wiring up a
  transactional email service (e.g. Resend, SendGrid) is a natural follow-up
  if automated invite emails are needed.
- **No CSRF token on admin POST actions** beyond the session cookie's
  `SameSite=Lax` — acceptable for a small reviewer pool, but a real
  double-submit CSRF token would be a good hardening step before wider use.
