import { useMemo, useState } from 'react'
import './App.css'

type TeamStatus = 'green' | 'gold' | 'red'

type PanelKey = 'pr' | 'dashboard' | 'checklist' | 'email'

function App() {
  const [activePanel, setActivePanel] = useState<PanelKey>('pr')
  const [attestations, setAttestations] = useState<Record<string, string>>({
    'Secure Messaging': 'everything looks ok',
    Medications: 'everything looks ok',
    'Medical Records': 'everything looks ok',
    'Health Tools': 'everything looks ok',
    'Platform & Infrastructure': 'everything looks ok',
    'Program Management': 'everything looks ok',
  })
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'Staging validation': true,
    'Product guide updated': true,
    'OCC notification': true,
    'Post-release validation plan': true,
  })
  const [shipReady, setShipReady] = useState(true)

  const dashboard = useMemo(() => [
    { team: 'Secure Messaging', status: 'green' as TeamStatus, metric: '+3%', p95: '180ms', errorRate: '0.2%' },
    { team: 'Medications', status: 'red' as TeamStatus, metric: '-90%', p95: '420ms', errorRate: '3.1%' },
    { team: 'Medical Records', status: 'green' as TeamStatus, metric: '+5%', p95: '220ms', errorRate: '0.5%' },
    { team: 'Health Tools', status: 'gold' as TeamStatus, metric: '+12%', p95: '260ms', errorRate: '1.2%' },
    { team: 'Platform & Infrastructure', status: 'green' as TeamStatus, metric: '+1%', p95: '150ms', errorRate: '0.1%' },
    { team: 'Program Management', status: 'green' as TeamStatus, metric: '+4%', p95: '170ms', errorRate: '0.2%' },
  ], [])

  const toggleAttestation = (team: string) => {
    setAttestations((current) => ({
      ...current,
      [team]: current[team] === 'everything looks ok' ? 'needs review' : 'everything looks ok',
    }))
  }

  const toggleChecklistItem = (item: string) => {
    setChecklist((current) => ({ ...current, [item]: !current[item] }))
  }

  return (
    <main className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">Demo 3</p>
        <h1>Vendor Rigor Console</h1>
        <p>Operational controls for PR rigor, daily attestation, release gates, and email policy enforcement.</p>
      </header>

      <nav className="tabs" aria-label="Console panels">
        {(['pr', 'dashboard', 'checklist', 'email'] as PanelKey[]).map((panel) => (
          <button key={panel} type="button" className={activePanel === panel ? 'active' : ''} onClick={() => setActivePanel(panel)}>{panel === 'pr' ? 'PR Board' : panel === 'dashboard' ? 'Dashboard Attestation' : panel === 'checklist' ? 'Ship Checklist' : 'Email Guardrail'}</button>
        ))}
      </nav>

      {activePanel === 'pr' && (
        <section className="panel-grid">
          <article className="panel">
            <h2>Cross-check PR board</h2>
            <ul className="stack-list">
              <li><strong>PR-881</strong> — BLOCKED: missing cross-team approval</li>
              <li><strong>PR-882</strong> — BLOCKED: missing Verification Steps</li>
              <li><strong>PR-883</strong> — MERGED-ready</li>
            </ul>
          </article>
          <article className="panel">
            <h2>This week’s reviewer rotation</h2>
            <p>Primary + backup reviewers are visible for each team, with current review counts.</p>
          </article>
        </section>
      )}

      {activePanel === 'dashboard' && (
        <section className="panel-grid">
          {dashboard.map((tile) => (
            <article key={tile.team} className={`tile ${tile.status}`}>
              <h3>{tile.team}</h3>
              <p>Metric vs baseline: {tile.metric}</p>
              <p>P95 latency: {tile.p95}</p>
              <p>Error rate: {tile.errorRate}</p>
              <p>Attestation: {attestations[tile.team] || 'pending'}</p>
              <button type="button" onClick={() => toggleAttestation(tile.team)}>{attestations[tile.team] === 'everything looks ok' ? 'Flag for review' : 'Mark as ok'}</button>
            </article>
          ))}
        </section>
      )}

      {activePanel === 'checklist' && (
        <section className="panel">
          <h2>Ship checklist gate</h2>
          <ul className="stack-list">
            {Object.entries(checklist).map(([item, done]) => (
              <li key={item}>
                <label>
                  <input type="checkbox" checked={done} onChange={() => toggleChecklistItem(item)} /> {item}
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setShipReady((current) => !current)}>{shipReady ? 'Ship' : 'Re-open gate'}</button>
          <p>{shipReady ? 'Release gate is ready.' : 'Release gate is paused until all items are completed.'}</p>
        </section>
      )}

      {activePanel === 'email' && (
        <section className="panel">
          <h2>Email guardrail</h2>
          <p>Any external government email outside the PDS Health domain triggers the guardrail and requires the required CC list.</p>
          <div className="email-card">
            <strong>Policy</strong>
            <p>Include PDS Health in the CC line for any government email outside the PDS Health domain.</p>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
