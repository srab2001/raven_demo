import type { CircuitState } from '../lib/circuitBreaker'

export type EndpointStat = {
  label: string
  state: CircuitState
  p50: number
  p99: number
}

const STATE_COLOR: Record<CircuitState, string> = { closed: 'green', 'half-open': 'gold', open: 'red' }
const STATE_LABEL: Record<CircuitState, string> = { closed: 'CLOSED', 'half-open': 'HALF-OPEN', open: 'OPEN' }

export default function EndpointHealth({ endpoints }: { endpoints: EndpointStat[] }) {
  return (
    <div className="endpoint-health">
      <h3>Endpoint health</h3>
      <div className="health-tiles">
        {endpoints.map((endpoint) => (
          <article key={endpoint.label} className={`health-tile health-${STATE_COLOR[endpoint.state]}`}>
            <p className="health-endpoint">{endpoint.label}</p>
            <p className="health-state">{STATE_LABEL[endpoint.state]}</p>
            <p className="health-metric">p50 {Math.round(endpoint.p50)}ms · p99 {Math.round(endpoint.p99)}ms</p>
          </article>
        ))}
      </div>
    </div>
  )
}
