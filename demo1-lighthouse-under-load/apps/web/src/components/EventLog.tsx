export type LogLevel = 'info' | 'error' | 'warn' | 'success'

export type LogEntry = {
  id: string
  ts: number
  message: string
  level: LogLevel
}

export default function EventLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="event-log" role="log" aria-live="polite" aria-label="Event log">
      <h3>Event log</h3>
      <ol className="log-list">
        {entries
          .slice()
          .reverse()
          .map((entry) => (
            <li key={entry.id} className={`log-entry log-${entry.level}`}>
              <span className="log-time">{new Date(entry.ts).toLocaleTimeString()}</span>
              <span className="log-message">{entry.message}</span>
            </li>
          ))}
      </ol>
    </div>
  )
}
