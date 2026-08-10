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
