import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readCookie, verifySession, SESSION_COOKIE_NAME } from '../lib/session'
import { requireAdmin } from '../lib/requireAdmin'
import { withErrorHandling } from '../lib/apiErrors'
import { ensureSchema, sql } from '../lib/db'

type EntryRow = { id: number; title: string; author_name: string; author_team: string; created_at: string; created_by: string | null }

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  await ensureSchema()

  if (req.method === 'GET') {
    const token = readCookie(req.headers.cookie, SESSION_COOKIE_NAME)
    const session = token ? await verifySession(token) : null
    if (!session) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }
    const rows = (await sql`SELECT id, title, author_name, author_team, created_at, created_by FROM pr_board_entries ORDER BY created_at ASC`) as EntryRow[]
    res.status(200).json({
      entries: rows.map((row) => ({
        id: `#PR-${row.id}`,
        title: row.title,
        author: `${row.author_name} (${row.author_team})`,
        createdAt: row.created_at,
        createdBy: row.created_by,
      })),
    })
    return
  }

  if (req.method === 'POST') {
    const token = readCookie(req.headers.cookie, SESSION_COOKIE_NAME)
    const session = token ? await verifySession(token) : null
    if (!session) {
      res.status(401).json({ error: 'Not signed in' })
      return
    }
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
    const authorName = typeof req.body?.authorName === 'string' ? req.body.authorName.trim() : ''
    const authorTeam = typeof req.body?.authorTeam === 'string' ? req.body.authorTeam.trim() : ''
    if (!title || !authorName || !authorTeam) {
      res.status(400).json({ error: 'title, authorName, and authorTeam are required' })
      return
    }
    const rows = (await sql`
      INSERT INTO pr_board_entries (title, author_name, author_team, created_by)
      VALUES (${title}, ${authorName}, ${authorTeam}, ${session.email})
      RETURNING id, title, author_name, author_team, created_at, created_by
    `) as EntryRow[]
    const row = rows[0]
    res.status(201).json({
      entry: {
        id: `#PR-${row.id}`,
        title: row.title,
        author: `${row.author_name} (${row.author_team})`,
        createdAt: row.created_at,
        createdBy: row.created_by,
      },
    })
    return
  }

  if (req.method === 'DELETE') {
    const session = await requireAdmin(req, res)
    if (!session) return
    const id = typeof req.body?.id === 'string' ? req.body.id : ''
    const numericId = Number(id.replace(/^#PR-/, ''))
    if (!id || !Number.isInteger(numericId)) {
      res.status(400).json({ error: 'id is required' })
      return
    }
    await sql`DELETE FROM pr_board_entries WHERE id = ${numericId}`
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'GET, POST, or DELETE required' })
})
