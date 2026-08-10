import type { FormEvent } from 'react'

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
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    onSubmit()
  }

  return (
    <section className="panel">
      <h2>Eligibility lookup</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="icn">ICN</label>
        <input id="icn" value={icn} onChange={(event) => onIcnChange(event.target.value)} autoComplete="off" />
        <button type="submit" disabled={loading}>{loading ? 'Looking up…' : 'Run lookup'}</button>
        {loading && <p className="lookup-status" role="status">Querying eligibility services for {icn}…</p>}
        {disabledReason && <p className="hint">{disabledReason}</p>}
      </form>
    </section>
  )
}
