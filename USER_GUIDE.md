# RAVEN/SQUARES Prototype User Guide

## What’s included

This repository contains three interactive demo prototypes:

- Demo 1: Lighthouse Under Load — a lookup experience that shows latency and failure-mode behavior.
- Demo 2: 508-First Eligibility Wizard — a keyboard-first wizard that walks through eligibility inputs and presents a plain-language result.
- Demo 3: Vendor Rigor Console — a governance console for PR review, attestation, release gates, and email policy.

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
