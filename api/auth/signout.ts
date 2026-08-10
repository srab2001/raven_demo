import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearSessionCookieHeader } from '../../lib/session'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', clearSessionCookieHeader())
  res.writeHead(302, { Location: '/login' })
  res.end()
}
