import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../../lib/requireAdmin'
import { ensureSchema, sql } from '../../lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required' })
    return
  }
  const session = await requireAdmin(req, res)
  if (!session) return

  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : ''
  if (!email) {
    res.status(400).json({ error: 'email is required' })
    return
  }

  await ensureSchema()
  await sql`UPDATE users SET status = 'approved', approved_at = now(), approved_by = ${session.email} WHERE email = ${email}`
  res.status(200).json({ ok: true })
}
