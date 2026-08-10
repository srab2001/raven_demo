# RAVEN/SQUARES Demonstration Prototypes

This package contains three deployable prototypes aligned to the Claude build brief:

- Demo 1: Lighthouse Under Load — chaos-injection eligibility lookup with a live event log, endpoint health tiles, and a circuit breaker. See [demo1-lighthouse-under-load/docs/FAILURE_MODE_CATALOG.md](demo1-lighthouse-under-load/docs/FAILURE_MODE_CATALOG.md).
- Demo 2: 508-First Eligibility Wizard — keyboard-first wizard with a live axe-core panel, an NVDA-phrasing screen-reader simulator, a Flesch-Kincaid reading-level meter, and a rules-vs-AI decision comparison. See [demo2-508-eligibility-wizard/docs/DECISION_TABLES.md](demo2-508-eligibility-wizard/docs/DECISION_TABLES.md).
- Demo 3: Vendor Rigor Console — PR cross-review board, daily dashboard attestation, ship-checklist release gate, and a government-email guardrail composer.

Each demo's `docs/` folder (where present) notes where this build simplifies
or deviates from the original build brief — mainly: no backend proxy or real
`sandbox-api.va.gov` OAuth integration (this is a static site with no place
to hold a client secret), no CI pipeline, and no VA Design System component
library dependency.

## Quick start

Each demo is a separate Vite React + TypeScript app.

```bash
cd demo1-lighthouse-under-load/apps/web
npm install
npm run dev
```

```bash
cd demo2-508-eligibility-wizard
npm install
npm run dev
```

```bash
cd demo3-vendor-rigor-console/apps/web
npm install
npm run dev
```

## Deployment

Deploy this repository as one Vercel project from the repository root. The root `npm run build` command builds all three apps and publishes them under `/demo1`, `/demo2`, and `/demo3`.

Production site: [raven-squares-build-package-1.vercel.app](https://raven-squares-build-package-1.vercel.app)

For a fuller walkthrough, see [USER_GUIDE.md](USER_GUIDE.md).
