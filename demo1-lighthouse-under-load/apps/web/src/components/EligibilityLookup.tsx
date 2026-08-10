import type { FormEvent } from 'react'

export default function EligibilityLookup({
  icn,
  onIcnChange,
  onSubmit,
  disabledReason,
}: {
  icn: string
  onIcnChange: (value: string) => void
  onSubmit: () => void
  disabledReason?: string
}) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="panel">
      <h2>Eligibility lookup</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="icn">ICN</label>
        <input id="icn" value={icn} onChange={(event) => onIcnChange(event.target.value)} autoComplete="off" />
        <button type="submit">Run lookup</button>
        {disabledReason && <p className="hint">{disabledReason}</p>}
      </form>
    </section>
  )
}
