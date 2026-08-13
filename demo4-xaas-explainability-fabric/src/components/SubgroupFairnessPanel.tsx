import type { ModelCardInfo, SubgroupMetric } from '../lib/types'

const DIMENSION_LABELS: Record<string, string> = {
  age: 'Age',
  race: 'Race',
  discharge_status: 'Discharge status',
  geography: 'Geography',
}

export default function SubgroupFairnessPanel({ metrics, modelCard }: { metrics: SubgroupMetric[]; modelCard: ModelCardInfo }) {
  const worst = metrics.reduce<SubgroupMetric | null>(
    (min, metric) => (min === null || metric.accuracy < min.accuracy ? metric : min),
    null,
  )
  const best = metrics.reduce<SubgroupMetric | null>(
    (max, metric) => (max === null || metric.accuracy > max.accuracy ? metric : max),
    null,
  )
  const gap = best && worst ? best.accuracy - worst.accuracy : 0

  return (
    <div className="sub-panel">
      <h3>(d) Subgroup performance — live model-card database</h3>
      <p className="model-card-meta">
        Model card <code>{modelCard.id}</code> v{modelCard.version} · owner {modelCard.owner} · last validated{' '}
        {new Date(modelCard.lastValidated).toLocaleDateString()}
      </p>
      {worst && gap >= 0.05 && (
        <p className="fairness-flag">
          Largest subgroup accuracy gap: {Math.round(gap * 100)} pts — lowest is {worst.group} (
          {DIMENSION_LABELS[worst.dimension] ?? worst.dimension}) at {Math.round(worst.accuracy * 100)}%.
        </p>
      )}
      <table className="fairness-table">
        <thead>
          <tr>
            <th scope="col">Dimension</th>
            <th scope="col">Group</th>
            <th scope="col">n</th>
            <th scope="col">Accuracy</th>
            <th scope="col">FPR</th>
            <th scope="col">FNR</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={`${metric.dimension}-${metric.group}`} className={metric === worst ? 'fairness-row-flagged' : ''}>
              <td>{DIMENSION_LABELS[metric.dimension] ?? metric.dimension}</td>
              <td>{metric.group}</td>
              <td>{metric.n}</td>
              <td>{Math.round(metric.accuracy * 100)}%</td>
              <td>{Math.round(metric.fpr * 100)}%</td>
              <td>{Math.round(metric.fnr * 100)}%</td>
              <td>{new Date(metric.lastUpdated).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
