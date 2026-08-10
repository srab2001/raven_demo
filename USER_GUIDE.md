# RAVEN/SQUARES Prototype User Guide

## What’s included

This repository contains three interactive demo prototypes:

- Demo 1: Lighthouse Under Load — an eligibility lookup with six chaos-injection scenarios (token revoke, malformed FHIR, empty bundle, circuit breaker, 429 rate limit), a live event log, and per-endpoint health tiles. For evaluators: use the "Chaos controls" panel to switch scenarios; each one renders a distinct, verifiable failure state (not just different text).
- Demo 2: 508-First Eligibility Wizard — a keyboard-first, one-question-per-screen wizard with a live accessibility panel (real axe-core scan on every step), an NVDA-style screen-reader simulator, a live Flesch-Kincaid reading-level meter, and a rules-vs-AI decision comparison with citations. For evaluators: toggle "NVDA simulator" on and tab through the separation-date step; use "Show divergence example" on the result step to see the human-review escalation.
- Demo 3: Vendor Rigor Console — a governance console with a cross-team PR review board, daily dashboard attestation, a ship-checklist release gate that blocks the Ship button until gates pass, and a government-email guardrail composer that blocks Send until a PDS Health contact is added or an override is logged.

## Signing in

Every page, including the three demos, requires Google sign-in and admin
approval. First-time visitors land on `/pending` after signing in until an
admin approves them at `/admin`. See [docs/ADMIN_AUTH.md](docs/ADMIN_AUTH.md)
for the required environment variables and the full approval workflow.

## Explainer callouts and hover tooltips

Each demo shows speech-bubble callouts (💬) next to key panels explaining
what you're looking at and why it's real (not a static mockup), plus a
hover tooltip above each of Demo 1's six chaos scenario buttons describing
what that scenario actually injects. Use the toggle at the bottom of each
demo to show or hide the callouts.

An admin can edit this callout and tooltip text — for any of the three
demos — from the "Edit demo copy" section on `/admin`, with no code deploy
required. Each item can be reset to its original default at any time.

## Under the hood

`/how-its-built` is a fourth, evaluator-facing page that walks through how
the platform itself is set up, wired together, and monitored — using the
same "show it live, don't just claim it" approach as the three demos, aimed
at the platform instead. It covers, with live data where possible:

1. **Setting up the instance** — which pieces exist (Edge Middleware, API
   routes, Neon Postgres, Google OAuth) and a live check of which required
   environment variables are set and whether the database is reachable
   right now.
2. **How the elements connect** — step-by-step walkthroughs of the Google
   sign-in flow and the content-edit flow, with the "why" behind each step.
3. **UI construction and data flow** — a live split-screen editor: change a
   callout's text on the left and watch it change on an embedded demo page
   on the right, with the exact API call annotated below it.
4. **Errors, live** — buttons that call the real admin API without a
   session, and with an invalid content key, to show the actual rejection
   response — plus a case study of the real production incident behind
   [docs/LESSONS-LEARNED.md](docs/LESSONS-LEARNED.md).
5. **Live status** — real signals (database reachability, your session,
   content-system health, current deployment) rather than decorative UI.

Any approved reviewer can view `/how-its-built`; saving or resetting a
content item from its live editor still requires an admin session, same as
`/admin`.

## How to run locally

1. Open a terminal in the repository root.
2. Choose one app and install dependencies:
   - Demo 1: `cd demo1-lighthouse-under-load/apps/web && npm install`
   - Demo 2: `cd demo2-508-eligibility-wizard && npm install`
   - Demo 3: `cd demo3-vendor-rigor-console/apps/web && npm install`
3. Start the app:
   - `npm run dev`
4. Open the local Vite URL shown in the terminal.

## How to deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, import the GitHub repository.
3. Use the repository root as the project root.
4. Keep the configured build command, `npm run build`, and output directory, `dist`.
5. Deploy and visit the generated preview or production URL:
   - [Production demo index](https://raven-squares-build-package-1.vercel.app) opens the demo index.
   - [Lighthouse Under Load](https://raven-squares-build-package-1.vercel.app/demo1/) opens Demo 1.
   - [508-First Eligibility Wizard](https://raven-squares-build-package-1.vercel.app/demo2/) opens Demo 2.
   - [Vendor Rigor Console](https://raven-squares-build-package-1.vercel.app/demo3/) opens Demo 3.

## Notes

- The deployment settings live in [vercel.json](vercel.json). The Vercel CLI creates local project metadata when it links the repository.
- Each demo is a Vite + React + TypeScript app; the root build combines them into one Vercel deployment.
