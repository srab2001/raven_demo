import { useEffect, useState } from 'react'
import './App.css'
import IntegrationSimulator, { type CallerOption } from './components/IntegrationSimulator'
import ExplanationCard from './components/ExplanationCard'
import AuditTicketList from './components/AuditTicketList'
import { GuidedTour, type TourStep } from './components/GuidedTour'
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
  const [tourActive, setTourActive] = useState(false)

  const TOUR_STEPS: TourStep[] = [
    {
      selector: '[data-tour="hero"]',
      title: 'Welcome to the XaaS fabric',
      body: 'One contract — POST /api/xaas/explain — that any RAVEN feature calls before showing a Veteran or caseworker a recommendation. Every response on this page is a real call to a real Postgres-backed microservice. This tour covers every part of the page; skip ahead or go back any time.',
    },
    {
      selector: '[data-tour="simulator"]',
      title: 'Integration simulator',
      body: 'Switch which RAVEN feature is calling — the same Explanation Card below re-renders against a different real payload shape from the same one endpoint, proving the contract generalizes.',
    },
    {
      selector: '[data-tour="explanation-card"]',
      title: 'The explanation, in full',
      body: 'Rules matched, source records, a real conformal confidence interval, and live subgroup fairness metrics — all real fields from the API response, not a mockup.',
    },
    {
      selector: '[data-tour="disagree-button"]',
      title: '"I disagree" is a real path',
      body: 'Clicking this opens a real disagreement flow that routes to a review queue — not a dead-end feedback form.',
    },
    {
      selector: '[data-tour="audit-trail"]',
      title: 'Disagree audit trail',
      body: 'Every disagreement lands here, persisted to the same Postgres instance as the rest of this site — the same append-only posture as Demo 3\'s ship-checklist audit trail.',
    },
  ]

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
      <header className="hero-card" data-tour="hero">
        <div className="hero-head">
          <div>
            <p className="eyebrow">Demo 4</p>
            <h1>Explainability-as-a-Service (XaaS) Fabric</h1>
          </div>
          <button type="button" className="tour-button" onClick={() => setTourActive(true)}>Take the tour</button>
        </div>
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
      <GuidedTour steps={TOUR_STEPS} active={tourActive} onClose={() => setTourActive(false)} />
    </main>
  )
}

export default App
