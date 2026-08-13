# XaaS contract — `/v1/explain` and `/v1/feedback`

This is the actual request/response shape implemented by
[`api/xaas/explain.ts`](../../api/xaas/explain.ts) and
[`api/xaas/feedback.ts`](../../api/xaas/feedback.ts) at the repo root — the
demo's Integration Simulator (`caller`) is the only thing that varies
between call sites; the contract itself does not change per caller.

Both endpoints require a signed-in session (the same cookie every other
`/api/*` route in this repo checks) and return `401` otherwise.

## `POST /api/xaas/explain`

```
POST /api/xaas/explain
Content-Type: application/json

{ "caller": "demo1" }
```

`caller` is one of `demo1`, `demo2`, `future` in this demo package — one
per model card seeded in `lib/xaas/modelCards.ts`. A real deployment would
replace `caller` with whatever identifies the calling feature and pass a
real recommendation/case reference instead.

```json
{
  "recommendationId": "rec_demo1_a1b2c3",
  "caller": "demo1",
  "program": "VA Health Care Priority Group",
  "rulesMatched": [
    { "id": "priority-group-2-3", "citation": "38 CFR § 17.36", "predicate": "...", "result": true }
  ],
  "sourceRecords": [
    { "system": "Coverage/v0", "resourceType": "Coverage", "resourceId": "8823", "retrievedAt": "...", "fields": { "status": "active" } }
  ],
  "confidence": {
    "point": 0.88, "lower": 0.79, "upper": 0.97,
    "method": "split-conformal", "coverageTarget": 0.9,
    "calibrationSetSize": 20, "calibrationAsOf": "2026-08-01T00:00:00Z"
  },
  "subgroupMetrics": [
    { "dimension": "age", "group": "65+", "n": 812, "accuracy": 0.91, "fpr": 0.04, "fnr": 0.06, "lastUpdated": "2026-08-01T00:00:00Z" }
  ],
  "modelCard": {
    "id": "lighthouse-eligibility-lookup", "version": "2026.3",
    "owner": "raven-benefits-ml@va.gov", "lastValidated": "2026-08-01T00:00:00Z",
    "notes": "Backs the Demo 1 eligibility lookup priority-group recommendation."
  },
  "disagreeEndpoint": "/api/xaas/feedback"
}
```

- `confidence` is computed live by `lib/xaas/conformal.ts` from residuals
  stored in the `conformal_residuals` table — see
  [MODEL_CARD_SCHEMA.md](MODEL_CARD_SCHEMA.md) for what's synthetic there.
- `subgroupMetrics` is a live `SELECT` against the `subgroup_metrics` table
  — this is the "live model-card database" the strategy doc names as item
  (d), not a hardcoded response.
- `rulesMatched` and `sourceRecords` come from `lib/xaas/rulesEngine.ts`, a
  pure decision table per caller (no DB, no network) — deliberately mirroring
  `demo2-508-eligibility-wizard/src/engine/rulesEngine.ts`'s "same input,
  same output" posture.

## `POST /api/xaas/feedback`

```
POST /api/xaas/feedback
Content-Type: application/json

{
  "recommendationId": "rec_demo1_a1b2c3",
  "modelCardId": "lighthouse-eligibility-lookup",
  "veteranCaseId": "case_a1b2c3",
  "reason": "missing_context",
  "freeText": "Veteran's discharge status was upgraded last month.",
  "caseworkerId": "cw_204"
}
```

```json
{
  "ticketId": "fb_7",
  "routedTo": ["raven-benefits-ml@va.gov", "a.whitfield@va.gov"],
  "routedToNames": ["raven-benefits-ml@va.gov", "A. Whitfield (caseworker)"],
  "slaHours": 24,
  "createdAt": "2026-08-13T18:30:00Z"
}
```

See [FEEDBACK_ROUTING.md](FEEDBACK_ROUTING.md) for the routing rule.

## `GET /api/xaas/feedback`

Returns the 20 most recent tickets across all model cards — backs the
"Disagree audit trail" panel at the bottom of the demo page. No filtering
by caller/program in this pass; a real deployment would scope this to the
caller's own program and add pagination.

## Known deviations from the original build brief

`CLAUDE_CODE_BUILD_BRIEF.md`'s Demo 4 section sketches a nested
`apps/web` + `apps/xaas-service` + `apps/model-card-db` layout with its own
Node/Express service. This build instead follows how the rest of this
repo's *real* backend already works: a top-level Vite app
(`demo4-xaas-explainability-fabric/`, same pattern as Demo 2) calling
Vercel serverless functions at the repo root (`api/xaas/explain.ts`,
`api/xaas/feedback.ts`, `lib/xaas/*.ts`) that share the same
`lib/db.ts`/Neon Postgres connection every other `/api/*` route in this
repo already uses — rather than standing up a second, separate service and
database. The contract (request/response shapes above) is unchanged from
the spec; only the deployment topology is simpler.
