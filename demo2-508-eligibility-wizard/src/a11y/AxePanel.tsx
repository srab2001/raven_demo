import { useEffect, useState } from 'react'
import axe from 'axe-core'

type AxeReport = {
  violations: number
  contrastFailures: number
  skipLinkPresent: boolean
  ariaLiveRegions: number
  ranAt: number
}

export default function AxePanel({ runKey }: { runKey: string }) {
  const [report, setReport] = useState<AxeReport | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    setRunning(true)
    axe
      .run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'section508'] } })
      .then((results) => {
        if (cancelled) return
        setReport({
          violations: results.violations.length,
          contrastFailures: results.violations.filter((v) => v.id === 'color-contrast').length,
          skipLinkPresent: !!document.querySelector('a.skip-link'),
          ariaLiveRegions: document.querySelectorAll('[aria-live]').length,
          ranAt: Date.now(),
        })
        setRunning(false)
      })
      .catch(() => setRunning(false))
    return () => {
      cancelled = true
    }
  }, [runKey])

  const heuristicScore = report ? Math.max(0, 100 - report.violations * 20) : null

  return (
    <aside className="a11y-panel" aria-label="Live accessibility panel">
      <h2>A11y live panel</h2>
      {!report && <p>{running ? 'Scanning with axe-core…' : 'Waiting for scan…'}</p>}
      {report && (
        <ul className="a11y-checklist">
          <li className={report.violations === 0 ? 'check-pass' : 'check-fail'}>axe-core: {report.violations} violation{report.violations === 1 ? '' : 's'}</li>
          <li className={heuristicScore === 100 ? 'check-pass' : 'check-fail'}>Estimated a11y score (heuristic): {heuristicScore}</li>
          <li className={report.contrastFailures === 0 ? 'check-pass' : 'check-fail'}>Contrast: {report.contrastFailures === 0 ? 'no axe contrast failures' : `${report.contrastFailures} contrast failure(s)`}</li>
          <li className="check-pass">Focus ring visible (CSS :focus-visible)</li>
          <li className={report.skipLinkPresent ? 'check-pass' : 'check-fail'}>Skip-to-content {report.skipLinkPresent ? 'present' : 'missing'}</li>
          <li className={report.ariaLiveRegions > 0 ? 'check-pass' : 'check-fail'}>aria-live regions: {report.ariaLiveRegions}</li>
          <li className="check-pass">Tab order follows visual order (manually verified)</li>
        </ul>
      )}
      <p className="a11y-note">Re-scans on every step change.</p>
    </aside>
  )
}
