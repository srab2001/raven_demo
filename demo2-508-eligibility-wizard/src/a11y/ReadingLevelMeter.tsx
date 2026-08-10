function countSyllables(word: string): number {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!normalized) return 0
  const groups = normalized.match(/[aeiouy]+/g)
  let count = groups ? groups.length : 1
  if (normalized.endsWith('e') && count > 1) count -= 1
  return Math.max(1, count)
}

export function fleschKincaidGrade(text: string): number {
  const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length)
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0)
  const grade = 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59
  return Math.max(0, grade)
}

export default function ReadingLevelMeter({ text }: { text: string }) {
  const grade = fleschKincaidGrade(text)
  const target = 8
  const pct = Math.min(100, (Math.min(grade, target * 1.5) / (target * 1.5)) * 100)
  const withinTarget = grade <= target

  return (
    <div className="reading-level">
      <p className="reading-level-label">Reading level (live)</p>
      <div className="reading-level-track">
        <div className={`reading-level-fill ${withinTarget ? 'level-ok' : 'level-over'}`} style={{ width: `${pct}%` }} />
        <div className="reading-level-target" style={{ left: '66.6%' }} title="8th-grade target" />
      </div>
      <p className={withinTarget ? 'check-pass' : 'check-fail'}>Flesch-Kincaid: Grade {grade.toFixed(1)} {withinTarget ? '(at or below 8th-grade target)' : '(above 8th-grade target)'}</p>
    </div>
  )
}
