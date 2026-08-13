import { useState } from 'react'
import RulesMatchedPanel from './RulesMatchedPanel'
import SourceRecordTrail from './SourceRecordTrail'
import ConfidenceBand from './ConfidenceBand'
import SubgroupFairnessPanel from './SubgroupFairnessPanel'
import DisagreeModal from './DisagreeModal'
import type { ExplainResponse } from '../lib/types'

type Props = {
  response: ExplainResponse
  onDisagreeSubmitted: () => void
}

export default function ExplanationCard({ response, onDisagreeSubmitted }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section className="panel explanation-card">
      <div className="explanation-header">
        <div>
          <p className="eyebrow">Recommendation {response.recommendationId}</p>
          <h2>{response.program}</h2>
        </div>
        <button type="button" className="disagree-button" onClick={() => setModalOpen(true)}>
          I disagree with this recommendation
        </button>
      </div>

      <div className="explanation-grid">
        <RulesMatchedPanel rules={response.rulesMatched} />
        <SourceRecordTrail records={response.sourceRecords} />
        <ConfidenceBand confidence={response.confidence} />
        <SubgroupFairnessPanel metrics={response.subgroupMetrics} modelCard={response.modelCard} />
      </div>

      {modalOpen && (
        <DisagreeModal
          response={response}
          onClose={() => setModalOpen(false)}
          onSubmitted={() => {
            setModalOpen(false)
            onDisagreeSubmitted()
          }}
        />
      )}
    </section>
  )
}
