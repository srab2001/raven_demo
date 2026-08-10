import { useState } from 'react'

type TeamStatus = 'green' | 'gold' | 'red'

type Tile = {
  team: string
  status: TeamStatus
  metric: string
  p95: string
  errorRate: string
  attester: string
  attestedAt: string
  quote: string
}

const INITIAL_TILES: Tile[] = [
  { team: 'Secure Messaging', status: 'green', metric: 'Msg sent volume: 42,180 (±2% baseline)', p95: '780ms', errorRate: '0.02%', attester: 'A. Chen', attestedAt: '09:12 ET', quote: 'Looked at SM dashboards, everything looks ok.' },
  { team: 'Medications', status: 'red', metric: 'Refill volume: -87% vs 7-day baseline', p95: '4.2s (was 900ms)', errorRate: '12%', attester: 'R. Silva', attestedAt: '09:07 ET', quote: 'Refill drop detected — paging on-call, notifying OCC.' },
  { team: 'Medical Records', status: 'green', metric: 'Downloads: 8,240 (baseline)', p95: '1.1s', errorRate: '0.1%', attester: 'L. Fernandez', attestedAt: '09:41 ET', quote: 'MR dashboards reviewed, everything looks ok.' },
  { team: 'Platform & Infrastructure', status: 'gold', metric: 'Attestation missing — auto-nag sent', p95: '—', errorRate: '—', attester: 'K. Nguyen (out today)', attestedAt: 'pending', quote: 'Reminder posted to #pds-daily-check at 09:45. Backup attester: J. Kim — expected by 10:00 ET.' },
]

export default function DashboardAttestation() {
  const [tiles, setTiles] = useState(INITIAL_TILES)

  const flagTile = (team: string) => {
    setTiles((current) =>
      current.map((tile) =>
        tile.team === team
          ? tile.status === 'green'
            ? { ...tile, status: 'red', quote: 'Flagged for review by evaluator.' }
            : { ...tile, status: 'green', quote: 'Reviewed and cleared, everything looks ok.', attestedAt: 'just now' }
          : tile,
      ),
    )
  }

  return (
    <section>
      <h2>Daily product health — {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</h2>
      <p className="subtext">Each product team confirms dashboard health by 10:00 ET • Auto-nags at 09:45 if missing</p>
      <div className="panel-grid">
        {tiles.map((tile) => (
          <article key={tile.team} className={`tile tile-${tile.status}`}>
            <div className="tile-head">
              <h3>{tile.team}</h3>
              <span className={`status-dot status-${tile.status}`} aria-label={`${tile.status} status`} />
            </div>
            <p className="tile-metric">{tile.metric}</p>
            {tile.status !== 'gold' && <p>P95 latency: {tile.p95} • Error rate: {tile.errorRate}</p>}
            <p className="tile-attester">Attester: {tile.attester} — {tile.attestedAt}</p>
            <div className={`slack-quote slack-quote-${tile.status}`}>
              <strong>{tile.status === 'red' ? 'Incident channel:' : tile.status === 'gold' ? 'Auto-nag:' : 'Slack #pds-daily-check:'}</strong>
              <p>"{tile.quote}"</p>
            </div>
            <button type="button" onClick={() => flagTile(tile.team)}>{tile.status === 'green' ? 'Flag for review' : 'Mark as ok'}</button>
          </article>
        ))}
      </div>
    </section>
  )
}
