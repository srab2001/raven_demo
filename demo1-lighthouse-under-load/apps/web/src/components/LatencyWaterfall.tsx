export type LatencyBar = { label: string; ms: number }

export default function LatencyWaterfall({ bars }: { bars: LatencyBar[] }) {
  return (
    <div className="bars" aria-label="Latency waterfall">
      <h3>API latency waterfall</h3>
      {bars.map((bar) => (
        <div key={bar.label} className="bar-row">
          <span>{bar.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.min(bar.ms / 4000, 1) * 100}%` }} />
          </div>
          <span>{Math.round(bar.ms)}ms</span>
        </div>
      ))}
    </div>
  )
}
