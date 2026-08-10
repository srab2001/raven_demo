import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE = 'session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  email: string
  name: string
  role: 'admin' | 'viewer'
  status: 'approved'
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (typeof payload.email !== 'string' || typeof payload.role !== 'string') return null
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
