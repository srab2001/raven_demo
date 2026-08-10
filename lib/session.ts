import { signHS256, verifyHS256 } from './jwt'

const SESSION_COOKIE = 'session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

export type SessionPayload = {
  email: string
  name: string
  role: 'admin' | 'viewer'
  status: 'approved'
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return signHS256(payload, requireSecret(), SESSION_TTL_SECONDS)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const payload = await verifyHS256(token, requireSecret())
    if (!payload || typeof payload.email !== 'string' || typeof payload.role !== 'string') return null
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export function sessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(';').map((part) => part.trim())
  for (const part of parts) {
    const [key, ...rest] = part.split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
