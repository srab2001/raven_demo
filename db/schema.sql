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
