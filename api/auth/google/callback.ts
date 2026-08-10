import type { VercelRequest, VercelResponse } from '@vercel/node'
import { exchangeCodeForIdToken, redirectUriFor } from '../../../lib/googleAuth'
import { readCookie, sessionCookieHeader, signSession } from '../../../lib/session'
import { ensureSchema, sql } from '../../../lib/db'

function adminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query
  const cookieHeader = req.headers.cookie
  const expectedState = readCookie(cookieHeader, 'oauth_state')
  const next = readCookie(cookieHeader, 'oauth_next') || '/'

  if (typeof code !== 'string' || typeof state !== 'string' || !expectedState || state !== expectedState) {
    res.writeHead(302, { Location: '/login?error=state' })
    return res.end()
  }

  try {
    const redirectUri = redirectUriFor(req.headers.host)
    const identity = await exchangeCodeForIdToken(code, redirectUri)
    if (!identity.emailVerified) {
      res.writeHead(302, { Location: '/login?error=unverified' })
      return res.end()
    }

    await ensureSchema()
    const email = identity.email.toLowerCase()
    const existing = await sql`SELECT * FROM users WHERE email = ${email}`
    const isBootstrapAdmin = adminAllowlist().includes(email)

    let status: string
    let role: string

    if (existing.length === 0) {
      role = isBootstrapAdmin ? 'admin' : 'viewer'
      status = isBootstrapAdmin ? 'approved' : 'pending'
      await sql`
        INSERT INTO users (email, google_sub, name, status, role, approved_at, approved_by)
        VALUES (${email}, ${identity.sub}, ${identity.name}, ${status}, ${role}, ${status === 'approved' ? new Date().toISOString() : null}, ${status === 'approved' ? 'bootstrap' : null})
      `
    } else {
      const row = existing[0]
      role = isBootstrapAdmin ? 'admin' : row.role
      status = isBootstrapAdmin ? 'approved' : row.status === 'invited' ? 'approved' : row.status
      await sql`
        UPDATE users SET google_sub = ${identity.sub}, name = ${identity.name}, status = ${status}, role = ${role},
          approved_at = CASE WHEN ${status} = 'approved' AND approved_at IS NULL THEN now() ELSE approved_at END
        WHERE email = ${email}
      `
    }

    const clearOauthCookies = [
      'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      'oauth_next=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    ]

    if (status !== 'approved') {
      res.setHeader('Set-Cookie', clearOauthCookies)
      res.writeHead(302, { Location: '/pending' })
      return res.end()
    }

    const token = await signSession({ email, name: identity.name, role: role as 'admin' | 'viewer', status: 'approved' })
    res.setHeader('Set-Cookie', [...clearOauthCookies, sessionCookieHeader(token)])
    res.writeHead(302, { Location: next.startsWith('/') ? next : '/' })
    res.end()
  } catch (error) {
    console.error('Google OAuth callback failed', error)
    res.writeHead(302, { Location: '/login?error=server' })
    res.end()
  }
}
