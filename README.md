# RAVEN/SQUARES Demonstration Prototypes

This package contains four deployable prototypes, built against the VA Lighthouse APIs, Section 508, and the Patient Portal contract's own rigor requirements, aligned to the Claude build brief:

- Demo 1: Lighthouse Under Load — a Veteran eligibility lookup against Patient/v0, Clinical/v0, and Coverage/v0 with chaos-injection failure modes, a live event log, endpoint health tiles, and a circuit breaker. See [demo1-lighthouse-under-load/docs/FAILURE_MODE_CATALOG.md](demo1-lighthouse-under-load/docs/FAILURE_MODE_CATALOG.md).
- Demo 2: 508-First Eligibility Wizard — a keyboard-first wizard with a live axe-core panel, an NVDA-phrasing screen-reader simulator, a Flesch-Kincaid reading-level meter, and a 38 CFR-cited rules-vs-AI decision comparison. See [demo2-508-eligibility-wizard/docs/DECISION_TABLES.md](demo2-508-eligibility-wizard/docs/DECISION_TABLES.md).
- Demo 3: Vendor Rigor Console — the four rigor controls (cross-team PR review, daily dashboard attestation, a ship-checklist release gate, and a PDS-Health email guardrail) the government asked for after reduced staffing during the Aug–Sep Oracle cutover opened gaps on the Patient Portal.
- Demo 4: Explainability-as-a-Service (XaaS) Fabric — a first-class microservice any RAVEN feature calls before showing a Veteran or caseworker a recommendation, returning the rules matched, the source records behind them, a live-computed conformal confidence interval, subgroup fairness metrics from a real Postgres-backed model-card database, and an "I disagree" path back to the model owner and caseworker. See [docs/XAAS_STRATEGY.md](docs/XAAS_STRATEGY.md) for the strategy and [demo4-xaas-explainability-fabric/docs/XAAS_CONTRACT.md](demo4-xaas-explainability-fabric/docs/XAAS_CONTRACT.md) for the API contract.

Each demo's `docs/` folder (where present) notes where this build simplifies
or deviates from the original build brief — mainly: no backend proxy or real
`sandbox-api.va.gov` OAuth integration (this is a static site with no place
to hold a client secret), no CI pipeline, and no VA Design System component
library dependency.

## Access control

All pages (including the demos) are gated behind Google sign-in and admin
approval — see [docs/ADMIN_AUTH.md](docs/ADMIN_AUTH.md) for setup, the
approval workflow, and the admin panel at `/admin`.

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

```bash
cd demo4-xaas-explainability-fabric
npm install
npm run dev
```

Demo 4's `npm run dev` only serves its frontend — its `/api/xaas/explain`
and `/api/xaas/feedback` calls need the same Vercel dev environment (and
`DATABASE_URL`/`SESSION_SECRET`, see [docs/ADMIN_AUTH.md](docs/ADMIN_AUTH.md))
as every other `/api/*` route in this repo. Run `vercel dev` from the
repository root to exercise those endpoints locally.

## Deployment

Deploy this repository as one Vercel project from the repository root. The root `npm run build` command builds all four apps and publishes them under `/demo1`, `/demo2`, `/demo3`, and `/demo4`.

Production site: [raven-squares-build-package-1.vercel.app](https://raven-squares-build-package-1.vercel.app)

For a fuller walkthrough, see [USER_GUIDE.md](USER_GUIDE.md).
