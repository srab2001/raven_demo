import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, sql } from '../lib/db'
import { withErrorHandling } from '../lib/apiErrors'

// Public and unauthenticated on purpose: it's just display copy for pages
// that are already gated by middleware, and every demo needs it to render.
export default withErrorHandling(async (_req: VercelRequest, res: VercelResponse) => {
  await ensureSchema()
  const rows = await sql`SELECT key, text FROM content_overrides`
  const overrides: Record<string, string> = {}
  for (const row of rows as Array<{ key: string; text: string }>) {
    overrides[row.key] = row.text
  }
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ overrides })
})
