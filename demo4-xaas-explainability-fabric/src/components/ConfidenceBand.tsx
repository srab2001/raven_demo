import type { Confidence } from '../lib/types'

function toPct(value: number): string {
  return `${Math.round(value * 100)}%`
}

export default function ConfidenceBand({ confidence }: { confidence: Confidence }) {
  const { point, lower, upper, coverageTarget, calibrationSetSize, calibrationAsOf } = confidence

  return (
    <div className="sub-panel">
      <h3>(c) Conformal confidence interval</h3>
      <div className="confidence-track" aria-hidden="true">
        <div className="confidence-band" style={{ left: toPct(lower), width: toPct(Math.max(0, upper - lower)) }} />
        <div className="confidence-point" style={{ left: toPct(point) }} />
      </div>
      <p className="confidence-readout">
        <strong>{toPct(point)}</strong> point estimate · <strong>{toPct(lower)}–{toPct(upper)}</strong> band at a{' '}
        {toPct(coverageTarget)} target coverage
      </p>
      <p className="confidence-meta">
        Split-conformal, calibrated on {calibrationSetSize} held-out cases as of{' '}
        {new Date(calibrationAsOf).toLocaleDateString()}.
      </p>
    </div>
  )
}
