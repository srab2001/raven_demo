import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'node:crypto'
import { buildGoogleAuthUrl, redirectUriFor } from '../../../lib/googleAuth'

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const state = randomBytes(16).toString('hex')
    const next = typeof req.query.next === 'string' ? req.query.next : '/'
    const redirectUri = redirectUriFor(req.headers.host)
    const authUrl = buildGoogleAuthUrl(redirectUri, state)

    res.setHeader('Set-Cookie', [
      `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      `oauth_next=${encodeURIComponent(next)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    ])
    res.writeHead(302, { Location: authUrl })
    res.end()
  } catch (error) {
    console.error('Failed to start Google OAuth flow', error)
    res.writeHead(302, { Location: '/login?error=server' })
    res.end()
  }
}
