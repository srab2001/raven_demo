import { verifyGoogleIdToken } from './jwt'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

export function redirectUriFor(host: string | undefined): string {
  const safeHost = host || 'raven-squares-build-package-1.vercel.app'
  return `https://${safeHost}/api/auth/google/callback`
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForIdToken(code: string, redirectUri: string): Promise<{ email: string; name: string; sub: string; emailVerified: boolean }> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status} ${await response.text()}`)
  }

  const tokenSet = (await response.json()) as { id_token?: string }
  if (!tokenSet.id_token) throw new Error('Google token response missing id_token')

  const payload = await verifyGoogleIdToken(tokenSet.id_token, requireEnv('GOOGLE_CLIENT_ID'))

  if (typeof payload.email !== 'string' || typeof payload.sub !== 'string') {
    throw new Error('Google id_token missing required claims')
  }

  return {
    email: payload.email,
    name: typeof payload.name === 'string' ? payload.name : payload.email,
    sub: payload.sub,
    emailVerified: payload.email_verified === true,
  }
}
