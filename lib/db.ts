import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

export const sql = neon(process.env.DATABASE_URL)

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
