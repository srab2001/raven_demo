import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireAdmin } from '../../lib/requireAdmin'
import { ensureSchema, sql } from '../../lib/db'
import { withErrorHandling } from '../../lib/apiErrors'

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required' })
    return
  }
  const session = await requireAdmin(req, res)
  if (!session) return

  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : ''
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'a valid email is required' })
    return
  }

  await ensureSchema()
  // Pre-approve: if they haven't signed in with Google yet, mark as 'invited' so the
  // first Google login flips them straight to 'approved'. If they already exist,
  // approve them outright.
  await sql`
    INSERT INTO users (email, status, role)
    VALUES (${email}, 'invited', 'viewer')
    ON CONFLICT (email) DO UPDATE SET
      status = CASE WHEN users.status = 'revoked' THEN 'invited' ELSE 'approved' END,
      approved_at = CASE WHEN users.status != 'invited' THEN now() ELSE users.approved_at END,
      approved_by = ${session.email}
  `
  res.status(200).json({ ok: true })
})
