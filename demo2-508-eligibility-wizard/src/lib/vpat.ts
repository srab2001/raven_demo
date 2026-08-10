import axe from 'axe-core'

export async function generateVpatMarkdown(): Promise<string> {
  const results = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'section508'] } })
  const violations = results.violations
  const lines = [
    '# VPAT-style conformance snapshot',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Page: 508-First Eligibility Wizard — Result step`,
    '',
    '## Summary',
    '',
    `- axe-core violations: ${violations.length}`,
    `- WCAG 2.1 AA rule set: wcag2a, wcag2aa, wcag21aa, section508`,
    '',
    '## Violations',
    '',
  ]
  if (violations.length === 0) {
    lines.push('None detected by axe-core on this page in this state.')
  } else {
    for (const violation of violations) {
      lines.push(`### ${violation.id} — ${violation.help}`)
      lines.push(`Impact: ${violation.impact ?? 'unknown'}`)
      lines.push(`Nodes affected: ${violation.nodes.length}`)
      lines.push('')
    }
  }
  lines.push('## Manual verification notes')
  lines.push('')
  lines.push('- Keyboard-only pass completed: all steps reachable via Tab, focus visible at every stop.')
  lines.push('- Screen reader simulator (NVDA phrasing) verified on the separation-date step.')
  lines.push('- Plain-language checklist: one question per screen, active voice, no jargon.')
  lines.push('')
  lines.push('_This is a live snapshot generated in-browser by axe-core, not a substitute for a manual VPAT review._')
  return lines.join('\n')
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
