# RAVEN/SQUARES Prototype User Guide

## What’s included

This repository contains three interactive demo prototypes:

- Demo 1: Lighthouse Under Load — an eligibility lookup with six chaos-injection scenarios (token revoke, malformed FHIR, empty bundle, circuit breaker, 429 rate limit), a live event log, and per-endpoint health tiles. For evaluators: use the "Chaos controls" panel to switch scenarios; each one renders a distinct, verifiable failure state (not just different text).
- Demo 2: 508-First Eligibility Wizard — a keyboard-first, one-question-per-screen wizard with a live accessibility panel (real axe-core scan on every step), an NVDA-style screen-reader simulator, a live Flesch-Kincaid reading-level meter, and a rules-vs-AI decision comparison with citations. For evaluators: toggle "NVDA simulator" on and tab through the separation-date step; use "Show divergence example" on the result step to see the human-review escalation.
- Demo 3: Vendor Rigor Console — a governance console with a cross-team PR review board, daily dashboard attestation, a ship-checklist release gate that blocks the Ship button until gates pass, and a government-email guardrail composer that blocks Send until a PDS Health contact is added or an override is logged.

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
