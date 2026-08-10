import type { FormEvent } from 'react'
import type { QueueItem } from '../lib/retryQueue'

const STATUS_LABEL: Record<QueueItem['status'], string> = {
  queued: 'Queued',
  retrying: 'Retrying',
  complete: 'Complete',
  failed: 'Failed',
}

export default function BulkQueue({
  bulkInput,
  onBulkInputChange,
  onSubmit,
  queue,
}: {
  bulkInput: string
  onBulkInputChange: (value: string) => void
  onSubmit: () => void
  queue: QueueItem[]
}) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="panel bulk-queue">
      <h2>Bulk lookup (429 rate-limit demo)</h2>
      <p>429 chaos is on — lookups run through this retry queue with exponential backoff. Up to 5 ICNs, comma-separated.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="bulk-icns">ICNs</label>
        <input id="bulk-icns" value={bulkInput} onChange={(event) => onBulkInputChange(event.target.value)} autoComplete="off" />
        <button type="submit">Queue lookups</button>
      </form>
      {queue.length > 0 && (
        <ul className="queue-list">
          {queue.map((item) => (
            <li key={item.icn} className={`queue-row queue-${item.status}`}>
              <span className="queue-icn">{item.icn}</span>
              <span className={`status-pill status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
              {item.status === 'retrying' && (
                <div className="retry-progress" aria-label={`Retry attempt ${item.attempts} of ${item.maxAttempts}`}>
                  <div className="retry-progress-fill" style={{ width: `${(item.attempts / item.maxAttempts) * 100}%` }} />
                </div>
              )}
              <span className="queue-attempts">{item.attempts > 0 ? `${item.attempts}/${item.maxAttempts} attempts` : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
