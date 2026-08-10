import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readCookie, verifySession, SESSION_COOKIE_NAME, type SessionPayload } from './session'

export async function requireAdmin(req: VercelRequest, res: VercelResponse): Promise<SessionPayload | null> {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE_NAME)
  const session = token ? await verifySession(token) : null
  if (!session) {
    res.status(401).json({ error: 'Not signed in' })
    return null
  }
  if (session.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' })
    return null
  }
  return session
}
