import type { RuleMatch } from '../lib/types'

export default function RulesMatchedPanel({ rules }: { rules: RuleMatch[] }) {
  return (
    <div className="sub-panel">
      <h3>(a) Eligibility rules matched</h3>
      <ul className="rule-list">
        {rules.map((rule) => (
          <li key={rule.id} className={rule.result ? 'rule-matched' : 'rule-unmatched'}>
            <span className="rule-status">{rule.result ? '✓ Matched' : '— Not matched'}</span>
            <code className="rule-predicate">{rule.predicate}</code>
            <span className="rule-citation">{rule.citation}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
