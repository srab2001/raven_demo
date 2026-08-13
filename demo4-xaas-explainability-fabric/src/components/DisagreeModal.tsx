import { useState, type FormEvent } from 'react'
import { submitDisagreement } from '../lib/xaasClient'
import type { ExplainResponse, FeedbackOutcome } from '../lib/types'

const CASEWORKERS = [
  { id: 'cw_204', label: 'A. Whitfield (cw_204)' },
  { id: 'cw_115', label: 'D. Cho (cw_115)' },
  { id: 'cw_309', label: 'M. Reyes (cw_309)' },
]

const REASONS = [
  { value: 'missing_context', label: 'Missing context (e.g. a status change not yet reflected)' },
  { value: 'incorrect_data', label: 'Incorrect source data' },
  { value: 'policy_change', label: 'Policy or rule has changed' },
  { value: 'other', label: 'Other' },
]

type Props = {
  response: ExplainResponse
  onClose: () => void
  onSubmitted: () => void
}

export default function DisagreeModal({ response, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState(REASONS[0].value)
  const [freeText, setFreeText] = useState('')
  const [caseworkerId, setCaseworkerId] = useState(CASEWORKERS[0].id)
  const [veteranCaseId, setVeteranCaseId] = useState(`case_${response.recommendationId.slice(-6)}`)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FeedbackOutcome | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const outcome = await submitDisagreement({
        recommendationId: response.recommendationId,
        modelCardId: response.modelCard.id,
        veteranCaseId,
        reason,
        freeText,
        caseworkerId,
      })
      setResult(outcome)
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="disagree-title">
      <div className="modal-card">
        <h2 id="disagree-title">(e) I disagree with this recommendation</h2>
        {result ? (
          <div className="disagree-result">
            <p>
              Ticket <strong>{result.ticketId}</strong> filed. Routed to: {result.routedToNames.join(', ')}. SLA:{' '}
              {result.slaHours}h.
            </p>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Reason
              <select value={reason} onChange={(event) => setReason(event.target.value)}>
                {REASONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              What should the model owner and caseworker know?
              <textarea value={freeText} onChange={(event) => setFreeText(event.target.value)} rows={4} required minLength={10} />
            </label>
            <label>
              Veteran case ID
              <input value={veteranCaseId} onChange={(event) => setVeteranCaseId(event.target.value)} required />
            </label>
            <label>
              Caseworker to notify
              <select value={caseworkerId} onChange={(event) => setCaseworkerId(event.target.value)}>
                {CASEWORKERS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {error && (
              <p className="error-banner" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
