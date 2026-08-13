-- Users table for the Google-auth + admin-approval gate.
-- Applied automatically on first request by lib/db.ts (ensureSchema),
-- but kept here for reference / manual inspection.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  google_sub TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'invited' | 'approved' | 'revoked'
  role TEXT NOT NULL DEFAULT 'viewer', -- 'admin' | 'viewer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT
);

-- Admin-editable overrides for demo callouts/tooltips (see lib/contentManifest.ts).
-- Also applied automatically by lib/db.ts (ensureSchema).
CREATE TABLE IF NOT EXISTS content_overrides (
  key TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- PR entries any approved viewer adds to Demo 3's Cross-check PR board
-- (see api/pr-board.ts). Cross-reviewer/quality/state for these rows stay
-- client-side/ephemeral, same as the seeded rows — only the base entry
-- persists. Also applied automatically by lib/db.ts (ensureSchema).
CREATE TABLE IF NOT EXISTS pr_board_entries (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_team TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

-- Demo 4 (XaaS Explainability Fabric) — the "live model-card database"
-- item (d) of the XaaS contract queries this live, plus the calibration
-- set behind item (c)'s conformal interval and the ticket queue behind
-- item (e)'s "I disagree" path. Seed data lives in lib/xaas/modelCards.ts
-- and is loaded idempotently by ensureXaasSeed(). Also applied
-- automatically by lib/db.ts (ensureSchema).
CREATE TABLE IF NOT EXISTS model_cards (
  id TEXT PRIMARY KEY,
  caller TEXT NOT NULL,
  program TEXT NOT NULL,
  model_version TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  last_validated TIMESTAMPTZ NOT NULL,
  coverage_target DOUBLE PRECISION NOT NULL,
  point_estimate DOUBLE PRECISION NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS subgroup_metrics (
  id SERIAL PRIMARY KEY,
  model_card_id TEXT NOT NULL REFERENCES model_cards(id),
  dimension TEXT NOT NULL, -- 'age' | 'race' | 'discharge_status' | 'geography'
  group_label TEXT NOT NULL,
  n INTEGER NOT NULL,
  accuracy DOUBLE PRECISION NOT NULL,
  fpr DOUBLE PRECISION NOT NULL,
  fnr DOUBLE PRECISION NOT NULL,
  as_of TIMESTAMPTZ NOT NULL,
  UNIQUE (model_card_id, dimension, group_label)
);

CREATE TABLE IF NOT EXISTS conformal_residuals (
  id SERIAL PRIMARY KEY,
  model_card_id TEXT NOT NULL REFERENCES model_cards(id),
  residual DOUBLE PRECISION NOT NULL -- |y_true - y_pred| on a synthetic held-out calibration set
);

CREATE TABLE IF NOT EXISTS disagree_tickets (
  id SERIAL PRIMARY KEY,
  recommendation_id TEXT NOT NULL,
  model_card_id TEXT NOT NULL REFERENCES model_cards(id),
  veteran_case_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  free_text TEXT,
  caseworker_id TEXT NOT NULL,
  routed_to TEXT NOT NULL, -- comma-separated emails (model owner + caseworker)
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);
