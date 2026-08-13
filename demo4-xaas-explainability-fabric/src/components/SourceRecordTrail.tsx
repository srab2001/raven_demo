import type { SourceRecord } from '../lib/types'

export default function SourceRecordTrail({ records }: { records: SourceRecord[] }) {
  return (
    <div className="sub-panel">
      <h3>(b) Source records</h3>
      <ul className="record-list">
        {records.map((record) => (
          <li key={`${record.system}-${record.resourceId}`} className="record-row">
            <div className="record-heading">
              <span className="record-system">{record.system}</span>
              <span className="record-ref">
                {record.resourceType}/{record.resourceId}
              </span>
            </div>
            <dl className="record-fields">
              {Object.entries(record.fields).map(([key, value]) => (
                <div key={key} className="record-field">
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="record-retrieved">Retrieved {new Date(record.retrievedAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
