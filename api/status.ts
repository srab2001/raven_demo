import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readCookie, verifySession, SESSION_COOKIE_NAME } from '../lib/session'
import { withErrorHandling } from '../lib/apiErrors'
import { ensureSchema, sql } from '../lib/db'
import { CONTENT_MANIFEST } from '../lib/contentManifest'

type OverrideRow = { key: string; updated_at: string; updated_by: string | null }

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE_NAME)
  const session = token ? await verifySession(token) : null
  if (!session) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
    ADMIN_EMAILS: !!process.env.ADMIN_EMAILS,
  }

  let dbOk = false
  let dbError: string | null = null
  let overrideCount = 0
  let staleOverrides: string[] = []
  let lastEdit: { key: string; updatedAt: string; updatedBy: string | null } | null = null

  try {
    await ensureSchema()
    await sql`SELECT 1`
    dbOk = true
    const rows = (await sql`SELECT key, updated_at, updated_by FROM content_overrides ORDER BY updated_at DESC`) as OverrideRow[]
    overrideCount = rows.length
    const manifestKeys = new Set(CONTENT_MANIFEST.map((item) => item.key))
    staleOverrides = rows.filter((row) => !manifestKeys.has(row.key)).map((row) => row.key)
    if (rows[0]) lastEdit = { key: rows[0].key, updatedAt: rows[0].updated_at, updatedBy: rows[0].updated_by }
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Unknown database error'
  }

  res.status(200).json({
    session: { email: session.email, role: session.role },
    env,
    db: { ok: dbOk, error: dbError },
    content: { overrideCount, staleOverrides, lastEdit },
    deployment: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      branch: process.env.VERCEL_GIT_COMMIT_REF || null,
      env: process.env.VERCEL_ENV || null,
    },
  })
})
