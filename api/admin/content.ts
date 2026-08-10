import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../../lib/requireAdmin'
import { ensureSchema, sql } from '../../lib/db'
import { withErrorHandling } from '../../lib/apiErrors'
import { CONTENT_MANIFEST } from '../../lib/contentManifest'

type OverrideRow = { key: string; text: string; updated_at: string; updated_by: string | null }

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  const session = await requireAdmin(req, res)
  if (!session) return

  await ensureSchema()

  if (req.method === 'GET') {
    const rows = (await sql`SELECT key, text, updated_at, updated_by FROM content_overrides`) as OverrideRow[]
    const overrideByKey = new Map(rows.map((row) => [row.key, row]))
    const items = CONTENT_MANIFEST.map((item) => {
      const override = overrideByKey.get(item.key)
      return {
        key: item.key,
        demo: item.demo,
        label: item.label,
        default: item.default,
        currentText: override?.text ?? item.default,
        isOverridden: !!override,
        updatedAt: override?.updated_at ?? null,
        updatedBy: override?.updated_by ?? null,
      }
    })
    res.status(200).json({ items })
    return
  }

  if (req.method === 'POST') {
    const key = typeof req.body?.key === 'string' ? req.body.key : ''
    const text = typeof req.body?.text === 'string' ? req.body.text : ''
    if (!key || !text.trim()) {
      res.status(400).json({ error: 'key and non-empty text are required' })
      return
    }
    if (!CONTENT_MANIFEST.some((item) => item.key === key)) {
      res.status(400).json({ error: 'unknown content key' })
      return
    }
    await sql`
      INSERT INTO content_overrides (key, text, updated_by)
      VALUES (${key}, ${text}, ${session.email})
      ON CONFLICT (key) DO UPDATE SET text = ${text}, updated_at = now(), updated_by = ${session.email}
    `
    res.status(200).json({ ok: true })
    return
  }

  if (req.method === 'DELETE') {
    const key = typeof req.body?.key === 'string' ? req.body.key : ''
    if (!key) {
      res.status(400).json({ error: 'key is required' })
      return
    }
    await sql`DELETE FROM content_overrides WHERE key = ${key}`
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'GET, POST, or DELETE required' })
})
