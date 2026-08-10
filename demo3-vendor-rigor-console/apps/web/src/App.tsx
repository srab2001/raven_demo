import { useState } from 'react'
import './App.css'
import PrBoard from './components/PrBoard'
import DashboardAttestation from './components/DashboardAttestation'
import ShipChecklist from './components/ShipChecklist'
import EmailGuardrail from './components/EmailGuardrail'

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
    <main className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">Demo 3</p>
        <h1>Vendor Rigor Console</h1>
        <p>Operational controls for PR rigor, daily attestation, release gates, and email policy enforcement.</p>
      </header>

      <nav className="tabs" aria-label="Console panels">
        {PANELS.map((panel) => (
          <button key={panel.key} type="button" className={activePanel === panel.key ? 'active' : ''} aria-pressed={activePanel === panel.key} onClick={() => setActivePanel(panel.key)}>
            {panel.label}
          </button>
        ))}
      </nav>

      {activePanel === 'pr' && <PrBoard />}
      {activePanel === 'dashboard' && <DashboardAttestation />}
      {activePanel === 'checklist' && <ShipChecklist />}
      {activePanel === 'email' && <EmailGuardrail />}
    </main>
  )
}

export default App
