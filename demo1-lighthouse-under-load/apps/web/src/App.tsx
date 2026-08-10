import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import EligibilityLookup from './components/EligibilityLookup'
import LatencyWaterfall, { type LatencyBar } from './components/LatencyWaterfall'
import ChaosToggle from './components/ChaosToggle'
import EventLog, { type LogEntry, type LogLevel } from './components/EventLog'
import EndpointHealth, { type EndpointStat } from './components/EndpointHealth'
import ResultPanel, { type ResultView } from './components/ResultPanel'
import BulkQueue from './components/BulkQueue'
import Callout from './components/Callout'
import CalloutToggle from './components/CalloutToggle'
import { ContentProvider } from './lib/contentContext'
import { CircuitBreaker, type CircuitState } from './lib/circuitBreaker'
import { validateFhirPatient, isEmptyBundle } from './lib/fhirValidator'
import { callEndpoint, revokeToken, resetRateLimitWindow, HttpError, type ChaosMode } from './lib/lighthouseClient'
import { backoffDelay, clearQueue, createQueue, loadQueue, persistQueue, type QueueItem } from './lib/retryQueue'

type Endpoint = 'Patient/v0' | 'Clinical/v0' | 'Coverage/v0'
const ENDPOINTS: Endpoint[] = ['Patient/v0', 'Clinical/v0', 'Coverage/v0']

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[index]
}

function App() {
  const [icn, setIcn] = useState('1013925208V123456')
  const [bulkInput, setBulkInput] = useState('1013925208V123456, 1013925209V654321, 1013925210V112233')
  const [chaos, setChaos] = useState<ChaosMode>('happy')
  const [log, setLog] = useState<LogEntry[]>([{ id: 'init', ts: Date.now(), message: 'System ready', level: 'info' }])
  const [resultView, setResultView] = useState<ResultView | null>(null)
  const [latencyBars, setLatencyBars] = useState<LatencyBar[]>(ENDPOINTS.map((label) => ({ label, ms: 0 })))
  const [endpointStats, setEndpointStats] = useState<EndpointStat[]>(ENDPOINTS.map((label) => ({ label, state: 'closed', p50: 0, p99: 0 })))
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)

  const breakersRef = useRef<Record<Endpoint, CircuitBreaker>>({
    'Patient/v0': new CircuitBreaker(),
    'Clinical/v0': new CircuitBreaker(),
    'Coverage/v0': new CircuitBreaker(),
  })
  const latenciesRef = useRef<Record<Endpoint, number[]>>({ 'Patient/v0': [], 'Clinical/v0': [], 'Coverage/v0': [] })
  const cacheRef = useRef<{ priorityGroup: string; coverage: string[]; timestamp: number }>({
    priorityGroup: 'Group 2',
    coverage: ['Primary Care', 'Pharmacy'],
    timestamp: Date.now(),
  })

  useEffect(() => {
    const unsubscribers = ENDPOINTS.map((endpoint) =>
      breakersRef.current[endpoint].onChange((state: CircuitState) => {
        setEndpointStats((current) => current.map((stat) => (stat.label === endpoint ? { ...stat, state } : stat)))
      }),
    )
    const restored = loadQueue()
    if (restored) setQueue(restored)
    return () => unsubscribers.forEach((unsub) => unsub())
  }, [])

  const addLog = useCallback((message: string, level: LogLevel = 'info') => {
    setLog((current) => [...current, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now(), message, level }])
  }, [])

  const recordLatency = useCallback((endpoint: Endpoint, ms: number) => {
    const bucket = latenciesRef.current[endpoint]
    bucket.push(ms)
    if (bucket.length > 20) bucket.shift()
    setLatencyBars((current) => current.map((bar) => (bar.label === endpoint ? { ...bar, ms } : bar)))
    setEndpointStats((current) => current.map((stat) => (stat.label === endpoint ? { ...stat, p50: percentile(bucket, 50), p99: percentile(bucket, 99) } : stat)))
  }, [])

  const callWithReauth = useCallback(
    async (endpoint: Endpoint, mode: ChaosMode) => {
      try {
        const outcome = await callEndpoint(endpoint, mode)
        recordLatency(endpoint, outcome.ms)
        breakersRef.current[endpoint].recordSuccess()
        return outcome
      } catch (error) {
        if (error instanceof HttpError && error.status === 401) {
          addLog(`${endpoint} → 401 Unauthorized (token revoked)`, 'error')
          addLog('Re-authenticating via OAuth2 client-credentials…', 'warn')
          const outcome = await callEndpoint(endpoint, 'happy')
          addLog(`${endpoint} → 200 OK after re-auth`, 'success')
          recordLatency(endpoint, outcome.ms)
          return outcome
        }
        throw error
      }
    },
    [addLog, recordLatency],
  )

  const toggleChaos = (mode: ChaosMode) => {
    setChaos(mode)
    if (mode === 'token') {
      revokeToken()
      addLog('Token revoked — next call receives 401', 'warn')
    }
    if (mode === 'ratelimit') resetRateLimitWindow()
    addLog(`Scenario changed to ${mode}`, 'info')
  }

  const runLookup = async () => {
    if (chaos === 'ratelimit') {
      enqueue([icn])
      return
    }

    setLookupLoading(true)
    try {
      await performLookup()
    } finally {
      setLookupLoading(false)
    }
  }

  const performLookup = async () => {
    addLog(`Lookup submitted for ${icn} (${chaos})`, 'info')

    const patient = await callWithReauth('Patient/v0', chaos)
    const clinical = await callWithReauth('Clinical/v0', chaos)

    if (chaos === 'slow') {
      const { data: coverage, wasTripped } = await breakersRef.current['Coverage/v0'].guard(
        () => callWithReauth('Coverage/v0', chaos),
        async () => {
          addLog('Coverage/v0 exceeded 3s trip threshold — circuit OPEN', 'error')
          return { endpoint: 'Coverage/v0' as const, ok: true, status: 200, ms: 0, payload: {} }
        },
      )
      if (wasTripped) {
        const ageMs = Date.now() - cacheRef.current.timestamp
        const staleLabel = ageMs < 60_000 ? `${Math.max(1, Math.round(ageMs / 1000))} seconds ago` : `${Math.round(ageMs / 60_000)} minutes ago`
        addLog('Serving cached Coverage/v0 result while circuit is open', 'warn')
        setResultView({ kind: 'stale', name: '[REDACTED]', dob: '[REDACTED]', priorityGroup: cacheRef.current.priorityGroup, coverage: cacheRef.current.coverage, staleLabel })
      } else {
        recordLatency('Coverage/v0', coverage.ms)
        cacheRef.current = { priorityGroup: 'Group 2', coverage: ['Primary Care', 'Pharmacy'], timestamp: Date.now() }
        setResultView({ kind: 'ok', name: '[REDACTED]', dob: '[REDACTED]', priorityGroup: 'Group 2', coverage: ['Primary Care', 'Pharmacy'] })
        addLog('Coverage/v0 → 200 OK, circuit stays CLOSED', 'success')
      }
      return
    }

    const validation = validateFhirPatient(patient.payload)
    if (!validation.valid) {
      const referenceId = `A${Math.floor(Math.random() * 90 + 10)}C-${Math.floor(Math.random() * 9000 + 1000)}`
      addLog(`Patient/v0 payload failed FHIR R4 validation (${validation.violations.length} violations) — ref ${referenceId}`, 'error')
      setResultView({ kind: 'malformed', referenceId, violations: validation.violations, rawPayload: patient.payload })
      await callWithReauth('Coverage/v0', chaos)
      return
    }

    const coverage = await callWithReauth('Coverage/v0', chaos)
    if (isEmptyBundle(coverage.payload)) {
      addLog('Coverage/v0 returned an empty bundle (0 results)', 'warn')
      setResultView({
        kind: 'missing',
        name: '[REDACTED]',
        dob: '[REDACTED]',
        priorityGroup: 'Group 2',
        onFallback: (source) => addLog(`Fallback query sent to ${source === 'verification' ? 'Verification API' : 'VADIR'} (mock)`, 'info'),
      })
      return
    }

    cacheRef.current = { priorityGroup: 'Group 2', coverage: ['Primary Care', 'Pharmacy'], timestamp: Date.now() }
    addLog(`Lookup complete for ${icn}`, 'success')
    setResultView({ kind: 'ok', name: '[REDACTED]', dob: '[REDACTED]', priorityGroup: 'Group 2', coverage: ['Primary Care', 'Pharmacy'] })
    void clinical
  }

  const enqueue = (icns: string[]) => {
    const items = createQueue(icns)
    setQueue(items)
    persistQueue(items)
    addLog(`Queued ${items.length} lookup${items.length === 1 ? '' : 's'} for retry-queue processing`, 'info')
    items.forEach((item) => processQueueItem(item.icn))
  }

  const processQueueItem = useCallback(
    async (icnValue: string) => {
      const attempt = async (attemptNumber: number): Promise<void> => {
        try {
          const outcome = await callEndpoint('Coverage/v0', 'ratelimit')
          recordLatency('Coverage/v0', outcome.ms)
          addLog(`${icnValue} → 200 OK after ${attemptNumber} attempt${attemptNumber === 1 ? '' : 's'}`, 'success')
          setQueue((current) => {
            const next = current.map((item) => (item.icn === icnValue ? { ...item, status: 'complete' as const, attempts: attemptNumber } : item))
            persistQueue(next)
            return next
          })
        } catch (error) {
          const retryAfterMs = error instanceof HttpError ? error.retryAfterMs : undefined
          addLog(`${icnValue} → 429 Too Many Requests (attempt ${attemptNumber + 1})`, 'error')
          if (attemptNumber >= 5) {
            setQueue((current) => {
              const next = current.map((item) => (item.icn === icnValue ? { ...item, status: 'failed' as const, attempts: attemptNumber + 1 } : item))
              persistQueue(next)
              return next
            })
            return
          }
          const delay = backoffDelay(attemptNumber, retryAfterMs)
          setQueue((current) => {
            const next = current.map((item) => (item.icn === icnValue ? { ...item, status: 'retrying' as const, attempts: attemptNumber + 1, nextRetryAt: Date.now() + delay } : item))
            persistQueue(next)
            return next
          })
          setTimeout(() => attempt(attemptNumber + 1), delay)
        }
      }
      await attempt(0)
    },
    [addLog, recordLatency],
  )

  const submitBulk = () => {
    const icns = bulkInput
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 5)
    clearQueue()
    enqueue(icns)
  }

  return (
    <ContentProvider>
    <main className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">Demo 1</p>
        <h1>Lighthouse Under Load</h1>
        <p>Eligibility lookup with visible failure modes and a transparent event trail.</p>
      </header>

      <section className="panel-grid">
        <section className="panel-stack">
          <EligibilityLookup
            icn={icn}
            onIcnChange={setIcn}
            onSubmit={runLookup}
            loading={lookupLoading}
            disabledReason={chaos === 'ratelimit' ? 'Rate-limit chaos routes lookups through the bulk queue below.' : undefined}
          />
          <Callout id="demo1.callout.lookup">Enter any ICN and click <strong>Run lookup</strong> to simulate a real call to Patient/v0, Clinical/v0, and Coverage/v0 — the same three Lighthouse APIs a live integration would hit.</Callout>
          <ResultPanel view={resultView} />
          <LatencyWaterfall bars={latencyBars} />
          <Callout id="demo1.callout.latency">Real per-API timing, redrawn after every lookup. Watch this bar for Coverage/v0 when you switch to the "Slow / circuit breaker" scenario below.</Callout>
          <EndpointHealth endpoints={endpointStats} />
          <Callout id="demo1.callout.health">Each tile is a live circuit-breaker state — CLOSED (green) is healthy, OPEN (red) means that endpoint tripped and is being served from cache instead of waiting.</Callout>
          {chaos === 'ratelimit' && (
            <>
              <BulkQueue bulkInput={bulkInput} onBulkInputChange={setBulkInput} onSubmit={submitBulk} queue={queue} />
              <Callout id="demo1.callout.bulkqueue">429 responses are retried automatically with exponential backoff (1s → 2s → 4s…) — watch the status pill on each row change from "Retrying" to "Complete."</Callout>
            </>
          )}
        </section>

        <aside className="panel-stack">
          <ChaosToggle value={chaos} onChange={toggleChaos} />
          <Callout id="demo1.callout.chaos">Switching scenarios here changes what the lookup actually returns — a real 401, a malformed FHIR payload, an empty bundle — not just the label on the result card.</Callout>
          <EventLog entries={log} />
          <Callout id="demo1.callout.eventlog">Every retry, cache decision, and re-auth is logged here as it happens — nothing about the failure handling is hidden from you.</Callout>
        </aside>
      </section>
      <CalloutToggle />
    </main>
    </ContentProvider>
  )
}

export default App
