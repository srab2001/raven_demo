import { useEffect, useState } from 'react'
import Callout from './Callout'

type PrRow = {
  id: string
  title: string
  author: string
  crossReviewer: string | null
  quality: 'green' | 'red'
  qualityNote: string
  state: 'MERGED' | 'IN_REVIEW' | 'BLOCKED' | 'TERTIARY'
  persisted?: boolean
}

const INITIAL_ROWS: PrRow[] = [
  { id: '#4821', title: 'secure-msg', author: 'A. Chen (SM team)', crossReviewer: 'M. Patel (Medications)', quality: 'green', qualityNote: 'Human-verified', state: 'MERGED' },
  { id: '#4822', title: 'med-refill fix', author: 'R. Silva (Meds)', crossReviewer: 'J. Kim (Health Tools)', quality: 'green', qualityNote: 'Human-verified', state: 'IN_REVIEW' },
  { id: '#4823', title: 'platform util', author: 'K. Nguyen (Platform)', crossReviewer: null, quality: 'red', qualityNote: 'Missing verify steps', state: 'BLOCKED' },
  { id: '#4824', title: 'dashboard', author: 'L. Fernandez (MR)', crossReviewer: 'A. Chen (SM) → Adrian (opt.)', quality: 'green', qualityNote: 'Human-verified', state: 'TERTIARY' },
]

const TEAMS = ['Secure Messaging', 'Medications', 'Medical Records', 'Platform & Infrastructure', 'Health Tools']

const ROTATION = [
  { team: 'Secure Messaging', primary: 'A. Chen', backup: 'T. Rao', reviews: 3 },
  { team: 'Medications', primary: 'R. Silva', backup: 'M. Patel', reviews: 4 },
  { team: 'Medical Records', primary: 'L. Fernandez', backup: 'D. Ochoa', reviews: 2 },
]

const STATE_LABEL: Record<PrRow['state'], string> = { MERGED: 'MERGED', IN_REVIEW: 'IN REVIEW', BLOCKED: 'BLOCKED', TERTIARY: 'TERTIARY' }

export default function PrBoard() {
  const [rows, setRows] = useState(INITIAL_ROWS)
  const [log, setLog] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newTeam, setNewTeam] = useState(TEAMS[0])
  const [addError, setAddError] = useState('')

  useEffect(() => {
    fetch('/api/session')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (data?.role === 'admin') setIsAdmin(true) })
      .catch(() => {})

    fetch('/api/pr-board')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data?.entries) return
        const persistedRows: PrRow[] = data.entries.map((entry: { id: string; title: string; author: string }) => ({
          id: entry.id,
          title: entry.title,
          author: entry.author,
          crossReviewer: null,
          quality: 'red',
          qualityNote: 'Awaiting cross-review',
          state: 'BLOCKED',
          persisted: true,
        }))
        setRows((current) => [...current, ...persistedRows])
      })
      .catch(() => {})
  }, [])

  const assignReviewer = (id: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, crossReviewer: 'J. Kim (Health Tools)', quality: 'green', qualityNote: 'Human-verified', state: 'IN_REVIEW' } : row)),
    )
    setLog((current) => [...current, `Bot enforced cross-team review on ${id} — assigned J. Kim (Health Tools)`])
  }

  const addPr = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    setAddError('')
    if (!newTitle.trim() || !newAuthor.trim()) {
      setAddError('Title and author are required.')
      return
    }
    const response = await fetch('/api/pr-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), authorName: newAuthor.trim(), authorTeam: newTeam }),
    })
    const data = await response.json()
    if (!response.ok) {
      setAddError(data.error || 'Could not add PR.')
      return
    }
    setRows((current) => [
      ...current,
      { id: data.entry.id, title: data.entry.title, author: data.entry.author, crossReviewer: null, quality: 'red', qualityNote: 'Awaiting cross-review', state: 'BLOCKED', persisted: true },
    ])
    setNewTitle('')
    setNewAuthor('')
  }

  const deletePr = async (id: string) => {
    const response = await fetch('/api/pr-board', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!response.ok) return
    setRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <section className="panel-grid">
      <article className="panel pr-board">
        <h2>Cross-check PR board — Patient Portal contract</h2>
        <p className="subtext">Every PR requires a strong engineer from another team to review before merge (Aug–Sep policy).</p>
        <div className="table-wrap" data-tour="pr-table">
          <table>
            <thead>
              <tr>
                <th>PR</th>
                <th>Author</th>
                <th>Cross-reviewer (other team)</th>
                <th>Description quality</th>
                <th>State</th>
                {isAdmin && <th>Remove</th>}
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
                  {isAdmin && <td>{row.persisted && <button type="button" className="danger" onClick={() => deletePr(row.id)}>Remove</button>}</td>}
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
        <form className="add-pr-form" onSubmit={addPr} data-tour="add-pr-form">
          <h3>Add a PR</h3>
          <div className="add-pr-fields">
            <label>
              Title
              <input type="text" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="e.g. notifications fix" />
            </label>
            <label>
              Author
              <input type="text" value={newAuthor} onChange={(event) => setNewAuthor(event.target.value)} placeholder="e.g. J. Rivera" />
            </label>
            <label>
              Team
              <select value={newTeam} onChange={(event) => setNewTeam(event.target.value)}>
                {TEAMS.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
            </label>
            <button type="submit">Add PR</button>
          </div>
          {addError && <p className="add-pr-error">{addError}</p>}
          <p className="footnote">New PRs start BLOCKED with no cross-reviewer assigned, same as the enforcement rule above — and persist for every viewer of this demo.</p>
        </form>
        <p className="footnote">Bot enforces: no merge without cross-team reviewer approval • PR template requires "Intended Effect" and "Verification Steps"</p>
        <Callout id="demo3.callout.prboard">#4823 is BLOCKED because no cross-team reviewer is assigned. Click "Assign cross-reviewer" to see the enforcement bot act, not just describe the rule.</Callout>
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
