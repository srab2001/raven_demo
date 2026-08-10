import { useState } from 'react'
import Callout from './Callout'

type GateStatus = 'passed' | 'failed' | 'armed'

type Gate = {
  title: string
  detail: string
  status: GateStatus
  label: string
}

const INITIAL_GATES: Gate[] = [
  { title: '1. Staging validation', detail: 'Full regression pass in staging (127/127 tests green) • Manual smoke by QA — S. Ivanov @ 12:40 ET', status: 'passed', label: 'PASSED' },
  { title: '2. Product guide updated (a11y call-out required)', detail: 'Product guide diff reviewed • Screen-reader impact section: "New attachment flow adds aria-live announcement"', status: 'passed', label: 'PUBLISHED' },
  { title: '3. OCC notification sent (preferred email + help desk protocol)', detail: 'Sent to occ-notifications@va.gov & help desk ticket #HD-8821 filed at 11:15 ET • Ack received', status: 'passed', label: 'ACKED' },
  { title: '4. Post-release validation plan (dashboards + analytics + trusted users)', detail: 'Dashboards subscribed • Analytics event verification queued • 3 trusted Veteran users on standby (T+30/60/120 min)', status: 'armed', label: 'ARMED (post-ship)' },
]

export default function ShipChecklist() {
  const [gates, setGates] = useState(INITIAL_GATES)
  const [shipped, setShipped] = useState(false)

  const toggleStaging = () => {
    setGates((current) =>
      current.map((gate, index) =>
        index === 0
          ? gate.status === 'passed'
            ? { ...gate, status: 'failed', label: 'FAILED — 3 tests red' }
            : { ...gate, status: 'passed', label: 'PASSED' }
          : gate,
      ),
    )
    setShipped(false)
  }

  const blockingGates = gates.filter((_gate, index) => index < 3)
  const shipReady = blockingGates.every((gate) => gate.status === 'passed')

  return (
    <section className="panel">
      <h2>Ship checklist — Secure Messaging v2.14 release</h2>
      <p className="subtext">All gates must be green before "Ship" button unlocks • Target release: 07 Aug 14:00 ET</p>
      <ul className="gate-list">
        {gates.map((gate) => (
          <li key={gate.title} className={`gate-row gate-${gate.status}`}>
            <div>
              <h3>{gate.title}</h3>
              <p>{gate.detail}</p>
            </div>
            <span className={`gate-label gate-label-${gate.status}`}>{gate.label}</span>
          </li>
        ))}
      </ul>
      <div className="actions">
        <button type="button" onClick={toggleStaging}>Re-run staging validation</button>
      </div>
      <Callout>Click that button to fail gate 1 — watch the Ship button below actually disable itself, not just show a warning. Gate 4 stays "ARMED (post-ship)" on purpose: it doesn't block shipping, it activates after.</Callout>
      {shipReady ? (
        <div className="all-green-banner">All pre-ship gates green. Ship signed off by: R. Silva (author) + M. Patel (cross-review) + PM approval.</div>
      ) : (
        <div className="not-ready-banner">Ship is blocked until gates 1–3 are green.</div>
      )}
      <button type="button" className="ship-button" disabled={!shipReady} onClick={() => setShipped(true)}>{shipped ? 'Shipped ✓' : 'Ship v2.14'}</button>
    </section>
  )
}
