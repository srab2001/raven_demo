import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Lazily initialized: importing this module must never throw, or a missing
// DATABASE_URL crashes the whole serverless function at cold start (before
// any handler's try/catch can run) instead of failing one request cleanly.
let client: NeonQueryFunction<false, false> | null = null

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    client = neon(process.env.DATABASE_URL)
  }
  return client
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getClient()(strings, ...values)
}

let schemaReady = false

export async function ensureSchema() {
  if (schemaReady) return
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      google_sub TEXT,
      name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      approved_at TIMESTAMPTZ,
      approved_by TEXT
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS content_overrides (
      key TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_by TEXT
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pr_board_entries (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_team TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by TEXT
    )
  `
  // Demo 4 (XaaS Explainability Fabric) — see lib/xaas/modelCards.ts for
  // the seed data ensureXaasSeed() loads into these tables.
  await sql`
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
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS subgroup_metrics (
      id SERIAL PRIMARY KEY,
      model_card_id TEXT NOT NULL REFERENCES model_cards(id),
      dimension TEXT NOT NULL,
      group_label TEXT NOT NULL,
      n INTEGER NOT NULL,
      accuracy DOUBLE PRECISION NOT NULL,
      fpr DOUBLE PRECISION NOT NULL,
      fnr DOUBLE PRECISION NOT NULL,
      as_of TIMESTAMPTZ NOT NULL,
      UNIQUE (model_card_id, dimension, group_label)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS conformal_residuals (
      id SERIAL PRIMARY KEY,
      model_card_id TEXT NOT NULL REFERENCES model_cards(id),
      residual DOUBLE PRECISION NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS disagree_tickets (
      id SERIAL PRIMARY KEY,
      recommendation_id TEXT NOT NULL,
      model_card_id TEXT NOT NULL REFERENCES model_cards(id),
      veteran_case_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      free_text TEXT,
      caseworker_id TEXT NOT NULL,
      routed_to TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by TEXT
    )
  `
  schemaReady = true
}

export type UserRow = {
  id: number
  email: string
  google_sub: string | null
  name: string | null
  status: 'pending' | 'invited' | 'approved' | 'revoked'
  role: 'admin' | 'viewer'
  created_at: string
  approved_at: string | null
  approved_by: string | null
}
