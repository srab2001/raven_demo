# Model card schema — what's live, what's synthetic

The three model cards, subgroup metrics, and conformal calibration
residuals seeded by `lib/xaas/modelCards.ts` (`ensureXaasSeed()`) live in
real Neon Postgres tables, defined in `lib/db.ts` (`ensureSchema()`) and
mirrored for reference in `db/schema.sql`:

```
model_cards(id, caller, program, model_version, owner_email, last_validated,
            coverage_target, point_estimate, notes)
subgroup_metrics(id, model_card_id, dimension, group_label, n, accuracy,
                  fpr, fnr, as_of)
conformal_residuals(id, model_card_id, residual)
disagree_tickets(id, recommendation_id, model_card_id, veteran_case_id,
                  reason, free_text, caseworker_id, routed_to, status,
                  created_at, created_by)
```

`GET /api/xaas/explain` (via its `SELECT`s against `subgroup_metrics` and
`conformal_residuals`) genuinely queries these tables on every call — that
part is real, not mocked. What's synthetic, and why:

- **`point_estimate` per model card** is a fixed seed value, not the output
  of a trained model. There is no production RAVEN recommendation model
  wired to this demo package.
- **`subgroup_metrics` rows** are hand-seeded, labeled figures across age,
  race, discharge status, and geography — not measured against real
  production traffic. They're deliberately varied (the HUD-VASH and GPD
  model cards show a wider subgroup accuracy gap than the priority-group
  model card) so the "largest subgroup accuracy gap" flag in
  `SubgroupFairnessPanel.tsx` has something real to detect.
- **`conformal_residuals`** are 20 hand-seeded values per model card, not
  drawn from an actual held-out calibration set. The split-conformal
  quantile calculation in `lib/xaas/conformal.ts` is the real algorithm —
  feed it a real residual set and it produces a real interval.

## What a production deployment would change

Per the phased roadmap in [docs/XAAS_STRATEGY.md](../../docs/XAAS_STRATEGY.md):

- Phase 1 replaces the seeded `point_estimate` and `conformal_residuals`
  with a real model's predictions and a real held-out calibration set.
- Phase 1 also replaces the seeded `subgroup_metrics` with a scheduled
  ingestion job reading from real production monitoring, instead of a
  one-time seed.
- Phase 2 adds versioning (multiple rows per `program` over time) and a
  governance review of what subgroup accuracy gap should trigger an
  automatic escalation, rather than the fixed 5-point demo threshold in
  `SubgroupFairnessPanel.tsx`.
