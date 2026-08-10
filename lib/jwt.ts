// Hand-rolled HS256 (session cookies) and RS256/JWK verification (Google
// id_token) using only Web Crypto (`crypto.subtle`) and other Web-standard
// globals (fetch, btoa/atob, TextEncoder) — deliberately zero imports.
//
// This repo previously used `jose`, which ships ESM-only. That forced a
// module-type dance with Vercel's Node.js function bundler that didn't
// reliably work in production. Switching to Node's own `crypto` module
// would have fixed that but broken `middleware.ts`, which runs on Vercel's
// Edge Runtime and doesn't have Node's `crypto` module at all. Web Crypto is
// the one thing available, identically, in both runtimes and regardless of
// whether the compiled output ends up as CommonJS or ESM.

function base64urlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (padded.length % 4)) % 4
  const binary = atob(padded + '='.repeat(padLength))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', textToBytes(secret) as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function signHS256(payload: Record<string, unknown>, secret: string, expiresInSeconds: number): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds }
  const signingInput = `${base64urlEncode(textToBytes(JSON.stringify(header)))}.${base64urlEncode(textToBytes(JSON.stringify(fullPayload)))}`
  const key = await hmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, textToBytes(signingInput) as BufferSource)
  return `${signingInput}.${base64urlEncode(new Uint8Array(signature))}`
}

export async function verifyHS256(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, signatureB64] = parts

  try {
    const key = await hmacKey(secret)
    const valid = await crypto.subtle.verify('HMAC', key, base64urlDecode(signatureB64) as BufferSource, textToBytes(`${headerB64}.${payloadB64}`) as BufferSource)
    if (!valid) return null

    const payload = JSON.parse(bytesToText(base64urlDecode(payloadB64))) as Record<string, unknown>
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

type GoogleJwk = { kid: string; n: string; e: string; kty: string }

let jwksCache: { keys: GoogleJwk[]; fetchedAt: number } | null = null
const JWKS_TTL_MS = 10 * 60 * 1000

async function getGoogleJwks(forceRefresh: boolean): Promise<GoogleJwk[]> {
  if (!forceRefresh && jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys
  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs')
  if (!response.ok) throw new Error(`Failed to fetch Google JWKS: ${response.status}`)
  const data = (await response.json()) as { keys: GoogleJwk[] }
  jwksCache = { keys: data.keys, fetchedAt: Date.now() }
  return data.keys
}

/** Verifies a Google-issued RS256 id_token against Google's published JWKS. Throws on any failure. */
export async function verifyGoogleIdToken(idToken: string, expectedAudience: string): Promise<Record<string, unknown>> {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Malformed id_token')
  const [headerB64, payloadB64, signatureB64] = parts

  const header = JSON.parse(bytesToText(base64urlDecode(headerB64))) as { kid?: string; alg?: string }
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unexpected id_token header')

  let keys = await getGoogleJwks(false)
  let jwk = keys.find((key) => key.kid === header.kid)
  if (!jwk) {
    keys = await getGoogleJwks(true)
    jwk = keys.find((key) => key.kid === header.kid)
  }
  if (!jwk) throw new Error('No matching Google signing key found')

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, base64urlDecode(signatureB64) as BufferSource, textToBytes(`${headerB64}.${payloadB64}`) as BufferSource)
  if (!isValid) throw new Error('id_token signature verification failed')

  const payload = JSON.parse(bytesToText(base64urlDecode(payloadB64))) as Record<string, unknown>
  const now = Math.floor(Date.now() / 1000)
  if (typeof payload.exp !== 'number' || payload.exp < now) throw new Error('id_token expired')
  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
    throw new Error('Unexpected id_token issuer')
  }
  if (payload.aud !== expectedAudience) throw new Error('Unexpected id_token audience')

  return payload
}
