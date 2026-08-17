import type { Caller } from '../lib/types'

export type CallerOption = { value: Caller; label: string; description: string }

type Props = {
  callers: CallerOption[]
  selected: Caller
  onChange: (value: Caller) => void
  loading: boolean
}

export default function IntegrationSimulator({ callers, selected, onChange, loading }: Props) {
  return (
    <section className="panel simulator-panel" data-tour="simulator">
      <h2>Integration simulator</h2>
      <p className="subtext">
        Pick which RAVEN feature is calling the XaaS contract — the same Explanation Card below renders
        against three different payload shapes from one <code>POST /api/xaas/explain</code> endpoint.
      </p>
      <div className="caller-options" role="radiogroup" aria-label="Calling feature">
        {callers.map((option) => (
          <label key={option.value} className={`caller-option ${selected === option.value ? 'selected' : ''}`}>
            <input
              type="radio"
              name="caller"
              value={option.value}
              checked={selected === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="caller-option-label">{option.label}</span>
            <span className="caller-option-description">{option.description}</span>
          </label>
        ))}
      </div>
      {loading && <p className="loading-note">Calling /api/xaas/explain…</p>}
    </section>
  )
}
