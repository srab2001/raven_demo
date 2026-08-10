import { useState } from 'react'

type PrRow = {
  id: string
  title: string
  author: string
  crossReviewer: string | null
  quality: 'green' | 'red'
  qualityNote: string
  state: 'MERGED' | 'IN_REVIEW' | 'BLOCKED' | 'TERTIARY'
}

const INITIAL_ROWS: PrRow[] = [
  { id: '#4821', title: 'secure-msg', author: 'A. Chen (SM team)', crossReviewer: 'M. Patel (Medications)', quality: 'green', qualityNote: 'Human-verified', state: 'MERGED' },
  { id: '#4822', title: 'med-refill fix', author: 'R. Silva (Meds)', crossReviewer: 'J. Kim (Health Tools)', quality: 'green', qualityNote: 'Human-verified', state: 'IN_REVIEW' },
  { id: '#4823', title: 'platform util', author: 'K. Nguyen (Platform)', crossReviewer: null, quality: 'red', qualityNote: 'Missing verify steps', state: 'BLOCKED' },
  { id: '#4824', title: 'dashboard', author: 'L. Fernandez (MR)', crossReviewer: 'A. Chen (SM) → Adrian (opt.)', quality: 'green', qualityNote: 'Human-verified', state: 'TERTIARY' },
]

const ROTATION = [
  { team: 'Secure Messaging', primary: 'A. Chen', backup: 'T. Rao', reviews: 3 },
  { team: 'Medications', primary: 'R. Silva', backup: 'M. Patel', reviews: 4 },
  { team: 'Medical Records', primary: 'L. Fernandez', backup: 'D. Ochoa', reviews: 2 },
]

const STATE_LABEL: Record<PrRow['state'], string> = { MERGED: 'MERGED', IN_REVIEW: 'IN REVIEW', BLOCKED: 'BLOCKED', TERTIARY: 'TERTIARY' }

export default function PrBoard() {
  const [rows, setRows] = useState(INITIAL_ROWS)
  const [log, setLog] = useState<string[]>([])

  const assignReviewer = (id: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, crossReviewer: 'J. Kim (Health Tools)', quality: 'green', qualityNote: 'Human-verified', state: 'IN_REVIEW' } : row)),
    )
    setLog((current) => [...current, `Bot enforced cross-team review on ${id} — assigned J. Kim (Health Tools)`])
  }

  return (
    <section className="panel-grid">
      <article className="panel pr-board">
        <h2>Cross-check PR board — Patient Portal contract</h2>
        <p className="subtext">Every PR requires a strong engineer from another team to review before merge (Aug–Sep policy).</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PR</th>
                <th>Author</th>
                <th>Cross-reviewer (other team)</th>
                <th>Description quality</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.state === 'BLOCKED' ? 'row-blocked' : ''}>
                  <td><strong>{row.id}</strong> {row.title}</td>
                  <td>{row.author}</td>
                  <td>
                    {row.crossReviewer ?? (
                      <>
                        <span className="none-assigned">— none assigned —</span>{' '}
                        <button type="button" onClick={() => assignReviewer(row.id)}>Assign cross-reviewer</button>
                      </>
                    )}
                  </td>
                  <td><span className={`quality-dot quality-${row.quality}`} /> {row.qualityNote}</td>
                  <td><span className={`state-pill state-${row.state.toLowerCase()}`}>{STATE_LABEL[row.state]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {log.length > 0 && (
          <ul className="bot-log">
            {log.map((entry, index) => <li key={index}>{entry}</li>)}
          </ul>
        )}
        <p className="footnote">Bot enforces: no merge without cross-team reviewer approval • PR template requires "Intended Effect" and "Verification Steps"</p>
      </article>

      <article className="panel">
        <h2>This week's reviewer rotation</h2>
        <div className="rotation-grid">
          {ROTATION.map((team) => (
            <div key={team.team} className="rotation-card">
              <h3>{team.team}</h3>
              <p>Primary: {team.primary}</p>
              <p>Backup: {team.backup}</p>
              <p className="rotation-count">{team.reviews} review{team.reviews === 1 ? '' : 's'} this week</p>
            </div>
          ))}
          <div className="rotation-card rotation-tertiary">
            <h3>Tertiary (on request)</h3>
            <p>Adrian, Steve</p>
            <p>Only AFTER team review</p>
            <p className="rotation-count">1 request this week</p>
          </div>
        </div>
      </article>
    </section>
  )
}
