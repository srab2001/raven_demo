// (c) Split-conformal confidence interval. Real quantile math over a
// calibration set of residuals — the residuals are synthetic (see
// modelCards.ts), the calculation is not.
//
// Standard split-conformal quantile: for a target coverage `1 - alpha`,
// take the ceil((n + 1) * (1 - alpha)) / n-th empirical quantile of the
// calibration residuals, then band = [point - q, point + q].
export type ConformalResult = {
  lower: number
  upper: number
  q: number
  calibrationSetSize: number
}

export function conformalInterval(point: number, residuals: number[], coverageTarget: number): ConformalResult {
  if (residuals.length === 0) {
    return { lower: point, upper: point, q: 0, calibrationSetSize: 0 }
  }
  const sorted = [...residuals].sort((a, b) => a - b)
  const n = sorted.length
  const rank = Math.min(n - 1, Math.max(0, Math.ceil(coverageTarget * (n + 1)) - 1))
  const q = sorted[rank]
  return {
    lower: Math.max(0, point - q),
    upper: Math.min(1, point + q),
    q,
    calibrationSetSize: n,
  }
}
