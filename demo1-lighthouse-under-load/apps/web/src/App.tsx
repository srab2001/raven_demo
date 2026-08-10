import { useMemo, useState, type FormEvent } from 'react'
import './App.css'

type DemoScenario = 'happy' | 'token' | 'malformed' | 'missing' | 'slow' | 'rate-limit'

type EligibilityResult = {
  name: string
  dob: string
  priorityGroup: string
  coverage: string[]
}

type ScenarioMeta = {
  label: string
  description: string
  severity: string
  priorityGroup: string
  coverage: string[]
}

const defaultResult: EligibilityResult = {
  name: 'A. Martinez',
  dob: '01/01/1950',
  priorityGroup: 'Group 2',
  coverage: ['Primary Care', 'Pharmacy'],
}

const scenarioMeta: Record<DemoScenario, ScenarioMeta> = {
  happy: { label: 'Happy path', description: 'All services respond normally and the lookup completes in a single pass.', severity: 'Healthy', priorityGroup: 'Group 2', coverage: ['Primary Care', 'Pharmacy'] },
  token: { label: 'Token issue', description: 'The token refresh endpoint is briefly failing, so the UI should surface the retry state.', severity: 'Warning', priorityGroup: 'Group 1', coverage: ['Primary Care', 'Behavioral Health'] },
  malformed: { label: 'Malformed payload', description: 'A downstream payload arrives without the expected fields, which bubbles into a validation warning.', severity: 'Warning', priorityGroup: 'Group 3', coverage: ['Primary Care'] },
  missing: { label: 'Missing data', description: 'One service returns no record for the member, which creates a partial result view.', severity: 'Alert', priorityGroup: 'Group 4', coverage: ['Emergency Care'] },
  slow: { label: 'Slow response', description: 'The performance waterfall shows latency spikes that explain the delayed result.', severity: 'Critical', priorityGroup: 'Group 1', coverage: ['Primary Care', 'Specialty Care', 'Pharmacy'] },
  'rate-limit': { label: 'Rate limit', description: 'A throttling response keeps the lookup from completing until the request is retried.', severity: 'Critical', priorityGroup: 'Group 2', coverage: ['Primary Care'] },
}

function App() {
  const [icn, setIcn] = useState('1013925208V123456')
  const [result, setResult] = useState<EligibilityResult | null>(defaultResult)
  const [scenario, setScenario] = useState<DemoScenario>('happy')
  const [log, setLog] = useState<string[]>(['System ready'])

  const latencyBars = useMemo(() => {
    const base = scenario === 'slow' ? 3200 : 180
    return [
      { label: 'Patient/v0', ms: scenario === 'slow' ? 1200 : 160 },
      { label: 'Clinical/v0', ms: scenario === 'slow' ? 1400 : 190 },
      { label: 'Coverage/v0', ms: scenario === 'slow' ? base : 220 },
    ]
  }, [scenario])

  const activeScenario = scenarioMeta[scenario]

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const nextResult: EligibilityResult = {
      name: 'A. Martinez',
      dob: '01/01/1950',
      priorityGroup: activeScenario.priorityGroup,
      coverage: activeScenario.coverage,
    }
    setLog((current) => [...current, `Lookup submitted for ${icn} using ${activeScenario.label}`])
    setResult(nextResult)
  }

  const toggleScenario = (value: DemoScenario) => {
    setScenario(value)
    setLog((current) => [...current, `Scenario changed to ${scenarioMeta[value].label}`])
  }

  return (
    <main className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">Demo 1</p>
        <h1>Lighthouse Under Load</h1>
        <p>Eligibility lookup with visible failure modes and a transparent event trail.</p>
      </header>

      <section className="panel-grid">
        <section className="panel">
          <h2>Eligibility lookup</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="icn">ICN</label>
            <input id="icn" value={icn} onChange={(event) => setIcn(event.target.value)} />
            <button type="submit">Run lookup</button>
          </form>
          {result && (
            <article className="result-card" aria-live="polite">
              <p className="eyebrow">{activeScenario.severity}</p>
              <h3>Eligibility result</h3>
              <p>{activeScenario.description}</p>
              <p><strong>Name:</strong> {result.name}</p>
              <p><strong>DOB:</strong> {result.dob}</p>
              <p><strong>Priority group:</strong> {result.priorityGroup}</p>
              <p><strong>Coverage:</strong> {result.coverage.join(', ')}</p>
            </article>
          )}
          <div className="bars" aria-label="Latency waterfall">
            {latencyBars.map((bar) => (
              <div key={bar.label} className="bar-row">
                <span>{bar.label}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(bar.ms / 4000, 1) * 100}%` }} /></div>
                <span>{bar.ms}ms</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="panel">
          <h2>Chaos controls</h2>
          <div className="controls">
            {(['happy', 'token', 'malformed', 'missing', 'slow', 'rate-limit'] as DemoScenario[]).map((value) => (
              <button key={value} type="button" className={scenario === value ? 'active' : ''} onClick={() => toggleScenario(value)}>{value}</button>
            ))}
          </div>
          <article className="result-card">
            <h3>Scenario focus</h3>
            <p><strong>{activeScenario.label}</strong></p>
            <p>{activeScenario.description}</p>
          </article>
          <h3>Event log</h3>
          <ol className="log-list">
            {log.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}
          </ol>
        </aside>
      </section>
    </main>
  )
}

export default App
