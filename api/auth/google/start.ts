import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'node:crypto'
import { buildGoogleAuthUrl, redirectUriFor } from '../../../lib/googleAuth'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const state = randomBytes(16).toString('hex')
  const next = typeof req.query.next === 'string' ? req.query.next : '/'
  const redirectUri = redirectUriFor(req.headers.host)

  res.setHeader('Set-Cookie', [
    `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    `oauth_next=${encodeURIComponent(next)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  ])
  res.writeHead(302, { Location: buildGoogleAuthUrl(redirectUri, state) })
  res.end()
}
