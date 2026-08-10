import type { FhirViolation } from '../lib/fhirValidator'

export type ResultView =
  | { kind: 'ok'; name: string; dob: string; priorityGroup: string; coverage: string[] }
  | { kind: 'malformed'; referenceId: string; violations: FhirViolation[]; rawPayload: Record<string, unknown> }
  | { kind: 'missing'; name: string; dob: string; priorityGroup: string; onFallback: (source: 'verification' | 'vadir') => void }
  | { kind: 'stale'; name: string; dob: string; priorityGroup: string; coverage: string[]; staleLabel: string }

export default function ResultPanel({ view }: { view: ResultView | null }) {
  if (!view) return null

  if (view.kind === 'ok') {
    return (
      <article className="result-card result-ok" aria-live="polite">
        <p className="eyebrow">Healthy</p>
        <h3>Eligibility confirmed</h3>
        <p><strong>Name:</strong> [REDACTED]</p>
        <p><strong>DOB:</strong> [REDACTED]</p>
        <p><strong>Priority group:</strong> {view.priorityGroup}</p>
        <p><strong>Coverage:</strong> {view.coverage.join(', ')}</p>
      </article>
    )
  }

  if (view.kind === 'malformed') {
    return (
      <article className="result-card result-error" aria-live="assertive">
        <p className="eyebrow">Eligibility not confirmed</p>
        <h3>We couldn't confirm eligibility right now</h3>
        <p>This is a system issue, not a problem with the Veteran's record.</p>
        <p className="reference">Reference number: <strong>#{view.referenceId}</strong></p>
        <details className="raw-payload">
          <summary>Raw payload (evaluator view)</summary>
          <pre>{JSON.stringify(view.rawPayload, null, 2)}</pre>
          <ul className="violation-list">
            {view.violations.map((violation) => (
              <li key={violation.path}>
                <code>{violation.path}</code> — {violation.issue}
              </li>
            ))}
          </ul>
          <p className="validator-status">FHIR R4 validator: FAIL — {view.violations.length} schema violation{view.violations.length === 1 ? '' : 's'}</p>
        </details>
      </article>
    )
  }

  if (view.kind === 'missing') {
    return (
      <>
        <article className="result-card result-ok" aria-live="polite">
          <p className="eyebrow">Patient record found</p>
          <p><strong>Name:</strong> [REDACTED]</p>
          <p><strong>DOB:</strong> [REDACTED]</p>
          <p><strong>Priority group:</strong> {view.priorityGroup}</p>
        </article>
        <article className="result-card result-warning" aria-live="polite">
          <p className="eyebrow">Coverage not returned</p>
          <h3>We didn't get a coverage record back</h3>
          <p>This does not mean the Veteran is ineligible — Coverage/v0 returned an empty result set. Try one of these other sources:</p>
          <div className="actions">
            <button type="button" onClick={() => view.onFallback('verification')}>Query Verification API</button>
            <button type="button" onClick={() => view.onFallback('vadir')}>Query VADIR</button>
          </div>
        </article>
      </>
    )
  }

  return (
    <>
      <div className="staleness-banner" role="status">
        Data last verified {view.staleLabel} — Coverage/v0 tripped its circuit breaker, showing cached result.
      </div>
      <article className="result-card result-ok" aria-live="polite">
        <p className="eyebrow">Served from cache</p>
        <p><strong>Name:</strong> [REDACTED]</p>
        <p><strong>DOB:</strong> [REDACTED]</p>
        <p><strong>Priority group:</strong> {view.priorityGroup}</p>
        <p><strong>Coverage:</strong> {view.coverage.join(', ')}</p>
      </article>
    </>
  )
}
