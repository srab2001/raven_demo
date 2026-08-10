import { useState, type FormEvent } from 'react'

// Real VA ICN format: 10 digits, then "V", then 6 digits (e.g. 1013925208V123456).
export const ICN_PATTERN = /^\d{10}V\d{6}$/

export function isValidIcn(value: string): boolean {
  return ICN_PATTERN.test(value.trim())
}

export default function EligibilityLookup({
  icn,
  onIcnChange,
  onSubmit,
  disabledReason,
  loading,
}: {
  icn: string
  onIcnChange: (value: string) => void
  onSubmit: () => void
  disabledReason?: string
  loading?: boolean
}) {
  const [attemptedInvalid, setAttemptedInvalid] = useState(false)
  const valid = isValidIcn(icn)
  const showError = attemptedInvalid && !valid

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    if (!valid) {
      setAttemptedInvalid(true)
      return
    }
    setAttemptedInvalid(false)
    onSubmit()
  }

  return (
    <section className="panel">
      <h2>Eligibility lookup</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="icn">ICN</label>
        <input
          id="icn"
          value={icn}
          onChange={(event) => onIcnChange(event.target.value)}
          autoComplete="off"
          aria-invalid={showError}
          aria-describedby={showError ? 'icn-error' : undefined}
        />
        {showError && (
          <p id="icn-error" className="field-error" role="alert">
            Enter a valid ICN — 10 digits, then "V", then 6 digits (e.g. 1013925208V123456).
          </p>
        )}
        <button type="submit" disabled={loading}>{loading ? 'Looking up…' : 'Run lookup'}</button>
        {loading && <p className="lookup-status" role="status">Querying eligibility services for {icn}…</p>}
        {disabledReason && <p className="hint">{disabledReason}</p>}
      </form>
    </section>
  )
}
