import type { ChaosMode } from '../lib/lighthouseClient'
import Tooltip from './Tooltip'

const SCENARIOS: Array<{ value: ChaosMode; label: string; indicator: string; hint: string }> = [
  { value: 'happy', label: 'Happy path', indicator: 'OFF', hint: 'All three APIs respond normally — a clean baseline lookup with no injected failure.' },
  { value: 'token', label: 'Revoke token', indicator: 'TOKEN', hint: 'The next call gets a real 401. Watch the event log show 401 → re-auth → 200, with no error surfaced to the user.' },
  { value: 'malformed', label: 'Malformed FHIR', indicator: 'SCHEMA', hint: 'Patient/v0 returns a payload missing required fields. A real FHIR R4 validator catches it and shows the violations.' },
  { value: 'missing', label: 'Empty bundle', indicator: 'EMPTY', hint: 'Coverage/v0 returns zero results while Patient/v0 still succeeds — an empty result, not proof of ineligibility.' },
  { value: 'slow', label: 'Slow / circuit breaker', indicator: 'SLOW', hint: 'Coverage/v0 hangs for 12s. The breaker trips at the 3s mark and serves cached data instead of making you wait.' },
  { value: 'ratelimit', label: '429 rate limit', indicator: '429', hint: 'Simulates a real 429 on the 3rd and 5th call in a 10s window — routes lookups through the retry queue below.' },
]

export default function ChaosToggle({ value, onChange }: { value: ChaosMode; onChange: (mode: ChaosMode) => void }) {
  const active = SCENARIOS.find((scenario) => scenario.value === value)!
  return (
    <div className="chaos-panel">
      <div className={`chaos-indicator ${value === 'happy' ? 'chaos-off' : 'chaos-on'}`}>
        <span className="chaos-dot" aria-hidden="true" />
        CHAOS: {active.indicator}
      </div>
      <h2>Chaos controls</h2>
      <div className="controls" role="group" aria-label="Chaos scenario">
        {SCENARIOS.map((scenario) => (
          <Tooltip key={scenario.value} id={`demo1.tooltip.${scenario.value}`} label={scenario.hint}>
            <button
              type="button"
              className={value === scenario.value ? 'active' : ''}
              aria-pressed={value === scenario.value}
              onClick={() => onChange(scenario.value)}
            >
              {scenario.label}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
