import { useState } from 'react'
import './App.css'
import PrBoard from './components/PrBoard'
import DashboardAttestation from './components/DashboardAttestation'
import ShipChecklist from './components/ShipChecklist'
import EmailGuardrail from './components/EmailGuardrail'
import Callout from './components/Callout'
import CalloutToggle from './components/CalloutToggle'
import { ContentProvider } from './lib/contentContext'

type PanelKey = 'pr' | 'dashboard' | 'checklist' | 'email'

const PANELS: Array<{ key: PanelKey; label: string }> = [
  { key: 'pr', label: 'PR Board' },
  { key: 'dashboard', label: 'Dashboard Attestation' },
  { key: 'checklist', label: 'Ship Checklist' },
  { key: 'email', label: 'Email Guardrail' },
]

function App() {
  const [activePanel, setActivePanel] = useState<PanelKey>('pr')

  return (
    <ContentProvider>
    <main className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">Demo 3</p>
        <h1>Vendor Rigor Console</h1>
        <p>Operational controls for PR rigor, daily attestation, release gates, and email policy enforcement.</p>
      </header>

      <section className="origin-note" aria-label="Why this console exists">
        <h2>Why this console exists</h2>
        <p>
          Reduced government-side staffing during the Aug–Sep Oracle cutover opened rigor gaps on the Patient Portal.
          The government contact issued four requirements — this console enforces each one with tooling, not memory:
        </p>
        <ol>
          <li><strong>Cross-check PRs</strong> across teams before merge → <em>PR Board</em></li>
          <li><strong>Daily product dashboard attestations</strong> → <em>Dashboard Attestation</em></li>
          <li><strong>A ship checklist</strong> covering staging, a product-guide update with a screen-reader call-out, OCC notification, and post-release validation → <em>Ship Checklist</em></li>
          <li><strong>Mandatory PDS Health inclusion</strong> on any government email outside PDS Health: Patient &amp; Clinical Experience → <em>Email Guardrail</em></li>
        </ol>
      </section>

      <nav className="tabs" aria-label="Console panels">
        {PANELS.map((panel) => (
          <button key={panel.key} type="button" className={activePanel === panel.key ? 'active' : ''} aria-pressed={activePanel === panel.key} onClick={() => setActivePanel(panel.key)}>
            {panel.label}
          </button>
        ))}
      </nav>
      <Callout id="demo3.callout.intro">Four governance surfaces for the Patient Portal contract — every control on these tabs is interactive, not a static mockup.</Callout>

      {activePanel === 'pr' && <PrBoard />}
      {activePanel === 'dashboard' && <DashboardAttestation />}
      {activePanel === 'checklist' && <ShipChecklist />}
      {activePanel === 'email' && <EmailGuardrail />}
      <CalloutToggle />
    </main>
    </ContentProvider>
  )
}

export default App
