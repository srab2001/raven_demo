import { useEffect, useState } from 'react'
import './App.css'
import IntegrationSimulator, { type CallerOption } from './components/IntegrationSimulator'
import ExplanationCard from './components/ExplanationCard'
import AuditTicketList from './components/AuditTicketList'
import { explain, listTickets } from './lib/xaasClient'
import type { Caller, ExplainResponse, FeedbackTicket } from './lib/types'

const CALLERS: CallerOption[] = [
  {
    value: 'demo1',
    label: 'Demo 1 — Eligibility lookup',
    description: 'Calls XaaS with the Patient/Coverage lookup that backs the VA Health Care Priority Group recommendation.',
  },
  {
    value: 'demo2',
    label: 'Demo 2 — Wizard result',
    description: 'Calls XaaS with the wizard session that backs the HUD-VASH recommendation.',
  },
  {
    value: 'future',
    label: 'Future RAVEN feature — GPD placement',
    description: 'A feature that does not exist in this demo package yet, calling the same contract to prove it generalizes.',
  },
]

function App() {
  const [caller, setCaller] = useState<Caller>('demo1')
  const [response, setResponse] = useState<ExplainResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<FeedbackTicket[]>([])

  async function runCall(nextCaller: Caller) {
    setLoading(true)
    setError(null)
    try {
      const result = await explain(nextCaller)
      setResponse(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function refreshTickets() {
    setTickets(await listTickets())
  }

  useEffect(() => {
    void runCall(caller)
    void refreshTickets()
    // Runs once on mount — handleCallerChange drives subsequent calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCallerChange(next: Caller) {
    setCaller(next)
    void runCall(next)
  }

  return (
    <main className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">Demo 4</p>
        <h1>Explainability-as-a-Service (XaaS) Fabric</h1>
        <p>
          One contract — <code>POST /api/xaas/explain</code> — that any RAVEN feature calls before showing a
          Veteran or caseworker a recommendation. Every response below is a real call to a real
          Postgres-backed microservice, not a canned mockup.
        </p>
      </header>

      <IntegrationSimulator callers={CALLERS} selected={caller} onChange={handleCallerChange} loading={loading} />

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {response && <ExplanationCard response={response} onDisagreeSubmitted={() => void refreshTickets()} />}

      <AuditTicketList tickets={tickets} />
    </main>
  )
}

export default App
