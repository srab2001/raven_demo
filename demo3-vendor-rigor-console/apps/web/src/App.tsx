import { useState } from 'react'
import './App.css'
import PrBoard from './components/PrBoard'
import DashboardAttestation from './components/DashboardAttestation'
import ShipChecklist from './components/ShipChecklist'
import EmailGuardrail from './components/EmailGuardrail'
import Callout from './components/Callout'
import CalloutToggle from './components/CalloutToggle'
import { GuidedTour, type TourStep } from './components/GuidedTour'
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
  const [tourActive, setTourActive] = useState(false)

  const TOUR_STEPS: TourStep[] = [
    {
      selector: '[data-tour="hero"]',
      title: 'Welcome to the Vendor Rigor Console',
      body: 'This console enforces four government-issued rigor requirements with tooling, not memory. This tour walks all four tabs in order — switching tabs for you as it goes. Skip ahead or go back any time.',
    },
    {
      selector: '[data-tour="origin-note"]',
      title: 'Why this console exists',
      body: 'An Oracle cutover staffing gap opened rigor gaps on the Patient Portal. The government contact issued four requirements — each one maps to a tab, which this tour visits next.',
    },
    {
      selector: '[data-tour="pr-table"]',
      title: 'Cross-check PR board',
      body: '#4823 is BLOCKED because no cross-team reviewer is assigned. Click "Assign cross-reviewer" (outside this tour) to see the enforcement bot act, not just describe the rule.',
      beforeShow: () => setActivePanel('pr'),
    },
    {
      selector: '[data-tour="add-pr-form"]',
      title: 'Add a PR — it persists',
      body: 'Any approved viewer can add a PR here; it starts BLOCKED with no reviewer, same as the enforcement rule above — and it persists to the database for every viewer of this demo, not just your browser tab.',
      beforeShow: () => setActivePanel('pr'),
    },
    {
      selector: '[data-tour="dashboard-tiles"]',
      title: 'Daily dashboard attestation',
      body: 'Medications is red — a real incident state. Platform & Infrastructure is gold — an overdue, auto-nagged attestation, not yet an incident. Click "Flag for review" on a green tile (outside this tour) to see the state change live.',
      beforeShow: () => setActivePanel('dashboard'),
    },
    {
      selector: '[data-tour="gate-list"]',
      title: 'Ship checklist — four gates',
      body: 'All four gates must be green before Ship unlocks. Gate 4 stays "ARMED (post-ship)" on purpose — it activates after shipping, it doesn\'t block it.',
      beforeShow: () => setActivePanel('checklist'),
    },
    {
      selector: '[data-tour="ship-button"]',
      title: 'The Ship button actually disables',
      body: 'Click "Re-run staging validation" (outside this tour) to fail gate 1 — watch this button actually disable itself, not just show a warning.',
      beforeShow: () => setActivePanel('checklist'),
    },
    {
      selector: '[data-tour="email-composer"]',
      title: 'Government email guardrail',
      body: 'Send stays disabled until the guardrail on the right is resolved — this demo enforces the PDS Health CC policy, it doesn\'t just describe it.',
      beforeShow: () => setActivePanel('email'),
    },
    {
      selector: '[data-tour="guardrail-notice"]',
      title: 'Resolving the guardrail',
      body: 'Add the suggested PDS Health contact, add a different one, or log a justified override — every path is logged to the weekly PDS Health digest.',
      beforeShow: () => setActivePanel('email'),
    },
  ]

  return (
    <ContentProvider>
    <main className="app-shell">
      <header className="hero-card" data-tour="hero">
        <div className="hero-head">
          <div>
            <p className="eyebrow">Demo 3</p>
            <h1>Vendor Rigor Console</h1>
          </div>
          <button type="button" className="tour-button" onClick={() => setTourActive(true)}>Take the tour</button>
        </div>
        <p>Operational controls for PR rigor, daily attestation, release gates, and email policy enforcement.</p>
      </header>

      <section className="origin-note" aria-label="Why this console exists" data-tour="origin-note">
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
      <GuidedTour steps={TOUR_STEPS} active={tourActive} onClose={() => setTourActive(false)} />
    </main>
    </ContentProvider>
  )
}

export default App
