const CHECKS = ['One question per screen', 'Active voice', 'No jargon ("separated" not "MEB\'d")', 'Progress preserved on close', "Errors announced via aria-live=\"polite\""]

export default function PlainLanguageChecklist() {
  return (
    <div className="plain-language">
      <p className="plain-language-label">Plain language checks (live)</p>
      <ul>
        {CHECKS.map((check) => (
          <li key={check} className="check-pass">{check}</li>
        ))}
      </ul>
    </div>
  )
}
