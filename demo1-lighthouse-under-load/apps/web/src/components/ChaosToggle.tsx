import type { ChaosMode } from '../lib/lighthouseClient'

const SCENARIOS: Array<{ value: ChaosMode; label: string; indicator: string }> = [
  { value: 'happy', label: 'Happy path', indicator: 'OFF' },
  { value: 'token', label: 'Revoke token', indicator: 'TOKEN' },
  { value: 'malformed', label: 'Malformed FHIR', indicator: 'SCHEMA' },
  { value: 'missing', label: 'Empty bundle', indicator: 'EMPTY' },
  { value: 'slow', label: 'Slow / circuit breaker', indicator: 'SLOW' },
  { value: 'ratelimit', label: '429 rate limit', indicator: '429' },
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
          <button
            key={scenario.value}
            type="button"
            className={value === scenario.value ? 'active' : ''}
            aria-pressed={value === scenario.value}
            onClick={() => onChange(scenario.value)}
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </div>
  )
}
