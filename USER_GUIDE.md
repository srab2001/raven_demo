# RAVEN/SQUARES Prototype User Guide

## What’s included

This repository contains three interactive demo prototypes:

- Demo 1: Lighthouse Under Load — an eligibility lookup with six chaos-injection scenarios (token revoke, malformed FHIR, empty bundle, circuit breaker, 429 rate limit), a live event log, and per-endpoint health tiles. For evaluators: use the "Chaos controls" panel to switch scenarios; each one renders a distinct, verifiable failure state (not just different text).
- Demo 2: 508-First Eligibility Wizard — a keyboard-first, one-question-per-screen wizard with a live accessibility panel (real axe-core scan on every step), an NVDA-style screen-reader simulator, a live Flesch-Kincaid reading-level meter, and a rules-vs-AI decision comparison with citations. For evaluators: toggle "NVDA simulator" on and tab through the separation-date step; use "Show divergence example" on the result step to see the human-review escalation.
- Demo 3: Vendor Rigor Console — a governance console with a cross-team PR review board, daily dashboard attestation, a ship-checklist release gate that blocks the Ship button until gates pass, and a government-email guardrail composer that blocks Send until a PDS Health contact is added or an override is logged. Any approved viewer can add a new PR (title, author, team) via the "Add a PR" form at the bottom of the PR board — it starts BLOCKED with no cross-reviewer assigned, same as the seeded example, and persists for every viewer until an admin removes it.

- Demo 4: Explainability-as-a-Service (XaaS) Fabric — an "Integration simulator" lets you pick which RAVEN feature is calling (Demo 1's eligibility lookup, Demo 2's wizard result, or a future GPD-placement feature that doesn't exist elsewhere in this package) and watch the same Explanation Card render rules matched, source records, a conformal confidence interval, live subgroup fairness metrics, and an "I disagree" button. For evaluators: switch callers to see the same `/api/xaas/explain` contract handle three different payload shapes; click "I disagree" to file a real ticket and watch it appear in the audit trail below. See [docs/XAAS_STRATEGY.md](docs/XAAS_STRATEGY.md).

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

## Take the tour

Every demo (1 through 4) has a "Take the tour" button next to its title.
It highlights each key section in sequence with a fixed guide card and
Back/Next/Skip controls, driven by a step list specific to that page — a
self-serve walkthrough for a first-time viewer exploring without a
presenter narrating live. Demo 2's tour advances the wizard itself
(discharge → separation → result) as it goes so it can highlight fields on
steps you haven't reached yet; Demo 3's tour switches tabs the same way.
See [docs/BEHIND_THE_HOOD_DEMO.md](docs/BEHIND_THE_HOOD_DEMO.md) for the
presenter-narrated version of the same walkthrough, click-by-click.

## How to run locally

1. Open a terminal in the repository root.
2. Choose one app and install dependencies:
   - Demo 1: `cd demo1-lighthouse-under-load/apps/web && npm install`
   - Demo 2: `cd demo2-508-eligibility-wizard && npm install`
   - Demo 3: `cd demo3-vendor-rigor-console/apps/web && npm install`
   - Demo 4: `cd demo4-xaas-explainability-fabric && npm install`
3. Start the app:
   - `npm run dev`
4. Open the local Vite URL shown in the terminal. Demo 4's API calls
   (`/api/xaas/explain`, `/api/xaas/feedback`) only work under `vercel dev`
   from the repository root with `DATABASE_URL` and `SESSION_SECRET` set —
   see [docs/ADMIN_AUTH.md](docs/ADMIN_AUTH.md).

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
   - [Explainability-as-a-Service Fabric](https://raven-squares-build-package-1.vercel.app/demo4/) opens Demo 4.

## Notes

- The deployment settings live in [vercel.json](vercel.json). The Vercel CLI creates local project metadata when it links the repository.
- Each demo is a Vite + React + TypeScript app; the root build combines them into one Vercel deployment.
