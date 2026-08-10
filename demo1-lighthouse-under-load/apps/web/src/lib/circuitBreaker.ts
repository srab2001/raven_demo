export type CircuitState = 'closed' | 'open' | 'half-open'

const TRIP_THRESHOLD_MS = 3000
const RECOVERY_SCHEDULE_MS = [1000, 3000, 7000, 15000]

type Listener = (state: CircuitState) => void

/**
 * Trips open when a call exceeds TRIP_THRESHOLD_MS. While open, callers should
 * serve cached data instead of waiting. Recovery probes fire on the schedule
 * above; a successful probe closes the circuit again.
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed'
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null
  private recoveryStep = 0
  private listeners = new Set<Listener>()

  getState() {
    return this.state
  }

  onChange(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private setState(next: CircuitState) {
    this.state = next
    this.listeners.forEach((listener) => listener(next))
  }

  /** Races a slow call against the trip threshold. Resolves with the winner's outcome. */
  async guard<T>(work: () => Promise<T>, probe: (isHealthy: boolean) => Promise<T>): Promise<{ data: T; wasTripped: boolean }> {
    if (this.state === 'open') {
      return { data: await probe(false), wasTripped: true }
    }

    let tripped = false
    const tripPromise = new Promise<{ data: T; wasTripped: boolean }>((resolve) => {
      const timer = setTimeout(async () => {
        tripped = true
        this.trip()
        resolve({ data: await probe(false), wasTripped: true })
      }, TRIP_THRESHOLD_MS)
      work().then((data) => {
        clearTimeout(timer)
        if (!tripped) {
          this.recordSuccess()
          resolve({ data, wasTripped: false })
        }
      })
    })

    return tripPromise
  }

  private trip() {
    if (this.state === 'closed') this.setState('open')
    this.scheduleRecovery()
  }

  private scheduleRecovery() {
    if (this.recoveryTimer) return
    const delay = RECOVERY_SCHEDULE_MS[Math.min(this.recoveryStep, RECOVERY_SCHEDULE_MS.length - 1)]
    this.recoveryTimer = setTimeout(() => {
      this.setState('half-open')
      this.recoveryTimer = null
    }, delay)
  }

  recordSuccess() {
    this.recoveryStep = 0
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
      this.recoveryTimer = null
    }
    if (this.state !== 'closed') this.setState('closed')
  }

  recordFailure() {
    this.recoveryStep += 1
    this.setState('open')
    this.scheduleRecovery()
  }

  reset() {
    this.recoveryStep = 0
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
      this.recoveryTimer = null
    }
    this.setState('closed')
  }
}

export const RECOVERY_SCHEDULE = RECOVERY_SCHEDULE_MS
export const TRIP_THRESHOLD = TRIP_THRESHOLD_MS
