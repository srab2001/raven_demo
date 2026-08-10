export type QueueStatus = 'queued' | 'retrying' | 'complete' | 'failed'

export type QueueItem = {
  icn: string
  status: QueueStatus
  attempts: number
  maxAttempts: number
  nextRetryAt: number | null
}

const STORAGE_KEY = 'demo1.retryQueue'
const MAX_RETRIES = 6
const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 16000]

export function createQueue(icns: string[]): QueueItem[] {
  return icns.map((icn) => ({ icn, status: 'queued', attempts: 0, maxAttempts: MAX_RETRIES, nextRetryAt: null }))
}

export function persistQueue(queue: QueueItem[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function loadQueue(): QueueItem[] | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as QueueItem[]
  } catch {
    return null
  }
}

export function clearQueue() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function backoffDelay(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs) return retryAfterMs
  return BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]
}
