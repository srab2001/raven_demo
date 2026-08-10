import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../../lib/requireAdmin'
import { ensureSchema, sql } from '../../lib/db'
import { withErrorHandling } from '../../lib/apiErrors'

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  const session = await requireAdmin(req, res)
  if (!session) return

  await ensureSchema()
  const users = await sql`SELECT email, name, status, role, created_at, approved_at, approved_by FROM users ORDER BY created_at DESC`
  res.status(200).json({ users })
})
