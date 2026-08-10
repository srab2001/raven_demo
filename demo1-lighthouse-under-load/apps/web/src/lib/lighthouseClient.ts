// Simulated Lighthouse (sandbox-api.va.gov) client.
//
// This repo deploys as a static Vercel site with no backend proxy, so there
// is nowhere to hold an OAuth client secret and no live network path to
// sandbox-api.va.gov. Every function below mirrors the request/response
// shape and timing of the real Veteran Verification + FHIR APIs described in
// the build brief (OAuth2 client-credentials, Patient/v0, Clinical/v0,
// Coverage/v0) so the chaos scenarios are observably identical to what a
// real proxy would produce. Swapping this module for `apps/proxy` calls is
// the only change needed to go live against the sandbox.

export type ChaosMode = 'happy' | 'token' | 'malformed' | 'missing' | 'slow' | 'ratelimit'

export type ApiCallOutcome = {
  endpoint: string
  ok: boolean
  status: number
  ms: number
  payload: Record<string, unknown>
}

export class HttpError extends Error {
  status: number
  retryAfterMs?: number
  constructor(status: number, message: string, retryAfterMs?: number) {
    super(message)
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

let bearerToken: string | null = 'sandbox-token-alpha'

export function revokeToken() {
  bearerToken = null
}

async function ensureToken(): Promise<{ ms: number }> {
  if (bearerToken) return { ms: 0 }
  await sleep(200)
  bearerToken = `sandbox-token-${Math.random().toString(36).slice(2, 8)}`
  return { ms: 200 }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Rolling 10-second call window used to simulate the sandbox's rate limiter.
const callWindow: number[] = []
function nextCallIndexInWindow(): number {
  const now = Date.now()
  while (callWindow.length && now - callWindow[0] > 10_000) callWindow.shift()
  callWindow.push(now)
  return callWindow.length
}
export function resetRateLimitWindow() {
  callWindow.length = 0
}

const happyPatient = {
  resourceType: 'Patient',
  identifier: [{ system: 'https://api.va.gov/services/veteran_verification', value: '1013925208V123456' }],
  name: [{ text: 'A. Martinez' }],
  birthDate: '1950-01-01',
  gender: 'male',
}

const happyCoverage = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 2,
  entry: [
    { resource: { resourceType: 'Coverage', type: { text: 'Primary Care' } } },
    { resource: { resourceType: 'Coverage', type: { text: 'Pharmacy' } } },
  ],
}

const happyClinical = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 1,
  entry: [{ resource: { resourceType: 'Observation', valueString: 'Priority Group 2' } }],
}

function malformedPatient() {
  return {
    identifier: [{ value: '' }],
    name: [{ text: 'A. Martinez' }],
    birthDate: '1950-01-01',
    gender: 'unknown_x',
  }
}

function emptyBundle() {
  return { resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] }
}

/**
 * Simulates one call to a Lighthouse FHIR endpoint under the given chaos mode.
 * Throws HttpError for 401/429; returns the (possibly malformed/empty) payload otherwise.
 */
export async function callEndpoint(endpoint: 'Patient/v0' | 'Clinical/v0' | 'Coverage/v0', chaos: ChaosMode): Promise<ApiCallOutcome> {
  const start = performance.now()

  if (chaos === 'ratelimit') {
    const index = nextCallIndexInWindow()
    if (index === 3 || index === 5) {
      throw new HttpError(429, `${endpoint} rate limited (call #${index} in 10s window)`, 2000)
    }
  }

  if (chaos === 'token' && !bearerToken) {
    throw new HttpError(401, `${endpoint} rejected expired bearer token`)
  }

  const { ms: authMs } = await ensureToken()

  if (chaos === 'slow' && endpoint === 'Coverage/v0') {
    await sleep(12_000)
    return { endpoint, ok: true, status: 200, ms: performance.now() - start, payload: happyCoverage }
  }

  const baseline = { 'Patient/v0': 160, 'Clinical/v0': 190, 'Coverage/v0': 220 }[endpoint]
  await sleep(baseline + Math.round(Math.random() * 40))

  if (chaos === 'malformed' && endpoint === 'Patient/v0') {
    return { endpoint, ok: true, status: 200, ms: performance.now() - start - authMs, payload: malformedPatient() }
  }

  if (chaos === 'missing' && endpoint === 'Coverage/v0') {
    return { endpoint, ok: true, status: 200, ms: performance.now() - start - authMs, payload: emptyBundle() }
  }

  const payload = endpoint === 'Patient/v0' ? happyPatient : endpoint === 'Clinical/v0' ? happyClinical : happyCoverage
  return { endpoint, ok: true, status: 200, ms: performance.now() - start - authMs, payload }
}

export async function lookupWithReauth(chaos: ChaosMode, endpoint: 'Patient/v0' | 'Clinical/v0' | 'Coverage/v0'): Promise<{ outcome: ApiCallOutcome; reauthed: boolean }> {
  try {
    const outcome = await callEndpoint(endpoint, chaos)
    return { outcome, reauthed: false }
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      bearerToken = `sandbox-token-${Math.random().toString(36).slice(2, 8)}`
      const outcome = await callEndpoint(endpoint, 'happy')
      return { outcome, reauthed: true }
    }
    throw error
  }
}
