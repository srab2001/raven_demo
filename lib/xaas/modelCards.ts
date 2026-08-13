import { sql } from '../db'

// The three callers wired into Demo 4's Integration Simulator. 'future' is
// deliberately a RAVEN feature that doesn't exist anywhere else in this
// repo — it exists to prove the XaaS contract works for a feature that
// hasn't been built yet, not just the two that have.
export type Caller = 'demo1' | 'demo2' | 'future'

export type ModelCardSeed = {
  id: string
  caller: Caller
  program: string
  modelVersion: string
  ownerEmail: string
  lastValidated: string
  coverageTarget: number
  pointEstimate: number
  notes: string
}

export const MODEL_CARDS: ModelCardSeed[] = [
  {
    id: 'lighthouse-eligibility-lookup',
    caller: 'demo1',
    program: 'VA Health Care Priority Group',
    modelVersion: '2026.3',
    ownerEmail: 'raven-benefits-ml@va.gov',
    lastValidated: '2026-08-01T00:00:00Z',
    coverageTarget: 0.9,
    pointEstimate: 0.88,
    notes: 'Backs the Demo 1 eligibility lookup priority-group recommendation.',
  },
  {
    id: 'hud-vash-wizard-recommendation',
    caller: 'demo2',
    program: 'HUD-VASH',
    modelVersion: '2026.3',
    ownerEmail: 'raven-benefits-ml@va.gov',
    lastValidated: '2026-08-01T00:00:00Z',
    coverageTarget: 0.9,
    pointEstimate: 0.82,
    notes: 'Backs the Demo 2 wizard result-step primary recommendation.',
  },
  {
    id: 'gpd-placement-recommendation',
    caller: 'future',
    program: 'GPD',
    modelVersion: '2026.0-pilot',
    ownerEmail: 'raven-benefits-ml@va.gov',
    lastValidated: '2026-08-05T00:00:00Z',
    coverageTarget: 0.85,
    pointEstimate: 0.74,
    notes: 'Pilot model for a Grant and Per Diem placement feature that does not exist in this demo package yet — included to prove the contract already covers RAVEN features that have not been built.',
  },
]

export type SubgroupMetricSeed = {
  modelCardId: string
  dimension: 'age' | 'race' | 'discharge_status' | 'geography'
  group: string
  n: number
  accuracy: number
  fpr: number
  fnr: number
  asOf: string
}

export const SUBGROUP_METRICS: SubgroupMetricSeed[] = [
  // lighthouse-eligibility-lookup
  { modelCardId: 'lighthouse-eligibility-lookup', dimension: 'age', group: 'Under 45', n: 430, accuracy: 0.86, fpr: 0.09, fnr: 0.11, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'lighthouse-eligibility-lookup', dimension: 'age', group: '65+', n: 812, accuracy: 0.91, fpr: 0.04, fnr: 0.06, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'lighthouse-eligibility-lookup', dimension: 'race', group: 'White', n: 1500, accuracy: 0.9, fpr: 0.05, fnr: 0.07, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'lighthouse-eligibility-lookup', dimension: 'race', group: 'Black or African American', n: 340, accuracy: 0.83, fpr: 0.1, fnr: 0.13, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'lighthouse-eligibility-lookup', dimension: 'discharge_status', group: 'Honorable', n: 2100, accuracy: 0.92, fpr: 0.04, fnr: 0.05, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'lighthouse-eligibility-lookup', dimension: 'discharge_status', group: 'General', n: 260, accuracy: 0.85, fpr: 0.08, fnr: 0.1, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'lighthouse-eligibility-lookup', dimension: 'geography', group: 'Urban', n: 1800, accuracy: 0.9, fpr: 0.05, fnr: 0.06, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'lighthouse-eligibility-lookup', dimension: 'geography', group: 'Rural', n: 560, accuracy: 0.84, fpr: 0.09, fnr: 0.12, asOf: '2026-08-01T00:00:00Z' },

  // hud-vash-wizard-recommendation
  { modelCardId: 'hud-vash-wizard-recommendation', dimension: 'age', group: 'Under 45', n: 690, accuracy: 0.88, fpr: 0.06, fnr: 0.08, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'hud-vash-wizard-recommendation', dimension: 'age', group: '65+', n: 210, accuracy: 0.85, fpr: 0.07, fnr: 0.09, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'hud-vash-wizard-recommendation', dimension: 'race', group: 'White', n: 520, accuracy: 0.87, fpr: 0.06, fnr: 0.08, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'hud-vash-wizard-recommendation', dimension: 'race', group: 'Black or African American', n: 310, accuracy: 0.79, fpr: 0.12, fnr: 0.14, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'hud-vash-wizard-recommendation', dimension: 'discharge_status', group: 'Honorable', n: 760, accuracy: 0.89, fpr: 0.05, fnr: 0.07, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'hud-vash-wizard-recommendation', dimension: 'discharge_status', group: 'General', n: 140, accuracy: 0.81, fpr: 0.11, fnr: 0.13, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'hud-vash-wizard-recommendation', dimension: 'geography', group: 'Urban', n: 640, accuracy: 0.88, fpr: 0.06, fnr: 0.08, asOf: '2026-08-01T00:00:00Z' },
  { modelCardId: 'hud-vash-wizard-recommendation', dimension: 'geography', group: 'Rural', n: 260, accuracy: 0.8, fpr: 0.11, fnr: 0.12, asOf: '2026-08-01T00:00:00Z' },

  // gpd-placement-recommendation
  { modelCardId: 'gpd-placement-recommendation', dimension: 'age', group: 'Under 45', n: 740, accuracy: 0.87, fpr: 0.07, fnr: 0.09, asOf: '2026-08-05T00:00:00Z' },
  { modelCardId: 'gpd-placement-recommendation', dimension: 'age', group: '65+', n: 180, accuracy: 0.83, fpr: 0.08, fnr: 0.1, asOf: '2026-08-05T00:00:00Z' },
  { modelCardId: 'gpd-placement-recommendation', dimension: 'race', group: 'White', n: 480, accuracy: 0.86, fpr: 0.07, fnr: 0.09, asOf: '2026-08-05T00:00:00Z' },
  { modelCardId: 'gpd-placement-recommendation', dimension: 'race', group: 'Black or African American', n: 390, accuracy: 0.78, fpr: 0.13, fnr: 0.15, asOf: '2026-08-05T00:00:00Z' },
  { modelCardId: 'gpd-placement-recommendation', dimension: 'discharge_status', group: 'Honorable', n: 620, accuracy: 0.88, fpr: 0.06, fnr: 0.08, asOf: '2026-08-05T00:00:00Z' },
  { modelCardId: 'gpd-placement-recommendation', dimension: 'discharge_status', group: 'General', n: 210, accuracy: 0.8, fpr: 0.12, fnr: 0.13, asOf: '2026-08-05T00:00:00Z' },
  { modelCardId: 'gpd-placement-recommendation', dimension: 'geography', group: 'Urban', n: 560, accuracy: 0.86, fpr: 0.07, fnr: 0.09, asOf: '2026-08-05T00:00:00Z' },
  { modelCardId: 'gpd-placement-recommendation', dimension: 'geography', group: 'Rural', n: 300, accuracy: 0.79, fpr: 0.12, fnr: 0.14, asOf: '2026-08-05T00:00:00Z' },
]

// Split-conformal calibration residuals — |y_true - y_pred| on a synthetic
// held-out set. Small (20 per model) and hand-seeded on purpose: real
// enough to run the actual split-conformal quantile calculation for real,
// small enough to review by eye. See docs/MODEL_CARD_SCHEMA.md.
export type ConformalResidualSeed = { modelCardId: string; residuals: number[] }

export const CONFORMAL_RESIDUALS: ConformalResidualSeed[] = [
  {
    modelCardId: 'lighthouse-eligibility-lookup',
    residuals: [
      0.02, 0.04, 0.05, 0.03, 0.06, 0.08, 0.01, 0.09, 0.11, 0.03, 0.07, 0.05, 0.02, 0.1, 0.06, 0.04, 0.03, 0.12, 0.08, 0.05,
    ],
  },
  {
    modelCardId: 'hud-vash-wizard-recommendation',
    residuals: [
      0.05, 0.09, 0.11, 0.07, 0.13, 0.06, 0.15, 0.08, 0.1, 0.04, 0.12, 0.09, 0.07, 0.16, 0.11, 0.08, 0.05, 0.14, 0.1, 0.09,
    ],
  },
  {
    modelCardId: 'gpd-placement-recommendation',
    residuals: [
      0.1, 0.16, 0.19, 0.13, 0.21, 0.11, 0.24, 0.14, 0.17, 0.09, 0.2, 0.15, 0.12, 0.25, 0.18, 0.14, 0.1, 0.22, 0.16, 0.15,
    ],
  },
]

let seeded = false

// Idempotent: safe to call on every cold start. Model cards use ON CONFLICT
// DO NOTHING on their primary key; subgroup metrics have a unique
// (model_card_id, dimension, group_label) constraint; residuals are only
// inserted the first time a model card has zero rows.
export async function ensureXaasSeed() {
  if (seeded) return

  for (const card of MODEL_CARDS) {
    await sql`
      INSERT INTO model_cards (id, caller, program, model_version, owner_email, last_validated, coverage_target, point_estimate, notes)
      VALUES (${card.id}, ${card.caller}, ${card.program}, ${card.modelVersion}, ${card.ownerEmail}, ${card.lastValidated}, ${card.coverageTarget}, ${card.pointEstimate}, ${card.notes})
      ON CONFLICT (id) DO NOTHING
    `
  }

  for (const metric of SUBGROUP_METRICS) {
    await sql`
      INSERT INTO subgroup_metrics (model_card_id, dimension, group_label, n, accuracy, fpr, fnr, as_of)
      VALUES (${metric.modelCardId}, ${metric.dimension}, ${metric.group}, ${metric.n}, ${metric.accuracy}, ${metric.fpr}, ${metric.fnr}, ${metric.asOf})
      ON CONFLICT (model_card_id, dimension, group_label) DO NOTHING
    `
  }

  for (const entry of CONFORMAL_RESIDUALS) {
    const existing = await sql`SELECT COUNT(*)::int AS count FROM conformal_residuals WHERE model_card_id = ${entry.modelCardId}`
    const count = (existing as Array<{ count: number }>)[0]?.count ?? 0
    if (count === 0) {
      await sql`
        INSERT INTO conformal_residuals (model_card_id, residual)
        SELECT ${entry.modelCardId}, r FROM unnest(${entry.residuals}::float8[]) AS r
      `
    }
  }

  seeded = true
}
