import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readCookie, verifySession, SESSION_COOKIE_NAME } from '../lib/session'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE_NAME)
  const session = token ? await verifySession(token) : null
  if (!session) {
    res.status(401).json({ authenticated: false })
    return
  }
  res.status(200).json({ authenticated: true, email: session.email, name: session.name, role: session.role })
}
