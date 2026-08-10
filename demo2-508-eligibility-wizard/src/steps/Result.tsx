import { useMemo, useState } from 'react'
import { useAutoFocusHeading } from '../hooks/useAutoFocusHeading'
import { useWizardStore } from '../state/wizardStore'
import { evaluateRules, primaryRecommendation } from '../engine/rulesEngine'
import { explainWithAi, forceDivergenceDemo, type AiResult } from '../engine/llmClient'
import { generateVpatMarkdown, downloadText } from '../lib/vpat'
import Callout from '../components/Callout'

export default function Result() {
  const headingRef = useAutoFocusHeading<HTMLHeadingElement>()
  const form = useWizardStore((state) => state.form)
  const back = useWizardStore((state) => state.back)
  const [mode, setMode] = useState<'rules' | 'ai'>('rules')
  const [showDivergence, setShowDivergence] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fires = useMemo(() => evaluateRules(form), [form])
  const recommendation = primaryRecommendation(fires)
  const aiResult: AiResult = useMemo(() => (showDivergence ? forceDivergenceDemo(fires) : explainWithAi(fires)), [fires, showDivergence])
  const diverges = aiResult.recommendation !== recommendation

  const handleDownloadVpat = async () => {
    setDownloading(true)
    try {
      const markdown = await generateVpatMarkdown()
      downloadText('VPAT-snapshot.md', markdown)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>Your recommended benefits</h2>
      <p>Based on your answers, here are the programs you likely qualify for.</p>

      <div className="engine-toggle" role="group" aria-label="Decision engine">
        <span className="engine-toggle-label">Decision engine:</span>
        <button type="button" className={mode === 'rules' ? 'active' : ''} aria-pressed={mode === 'rules'} onClick={() => setMode('rules')}>Rules</button>
        <button type="button" className={mode === 'ai' ? 'active' : ''} aria-pressed={mode === 'ai'} onClick={() => setMode('ai')}>AI</button>
        <span className="engine-toggle-hint">(toggle to compare)</span>
      </div>
      <Callout id="demo2.callout.enginetoggle">Rules mode runs a deterministic decision table over your answers. AI mode explains the same result with citations — click "Show divergence example" below to see what happens when they disagree.</Callout>

      {diverges && (
        <div className="divergence-banner" role="alert">
          Rules mode and AI mode disagree — <strong>{recommendation}</strong> vs <strong>{aiResult.recommendation}</strong>.
          <button type="button" onClick={() => alert('Sent to human review (mock).')}>Send to human review</button>
        </div>
      )}

      <div className="results-grid">
        {mode === 'rules' ? (
          <article className="result-card engine-card engine-rules">
            <h3>Rules mode</h3>
            <ul className="stack-list">
              {fires.map((fire) => (
                <li key={fire.program}>
                  → <strong>{fire.program}</strong>
                  <p className="predicate">{fire.predicate}</p>
                  <p className="citation">{fire.citation}</p>
                </li>
              ))}
            </ul>
            <p className="engine-footer">Deterministic • Auditable • pure function of wizard state</p>
          </article>
        ) : (
          <article className="result-card engine-card engine-ai">
            <h3>AI mode (constrained explainer)</h3>
            <p>→ <strong>{aiResult.recommendation}</strong></p>
            <p>Confidence: {Math.round(aiResult.confidence * 100)}%</p>
            <div className="confidence-track"><div className="confidence-fill" style={{ width: `${aiResult.confidence * 100}%` }} /></div>
            <p>Citations:</p>
            <ul>
              {aiResult.citations.map((citation) => (
                <li key={citation}>{citation}</li>
              ))}
            </ul>
            <p className="engine-footer">{aiResult.matchesRules ? 'Matches rules result' : 'Diverges from rules result — flagged for human review'}</p>
          </article>
        )}
      </div>

      <div className="ai-disclaimer" role="note">AI never decides eligibility — it explains the decision. All routing goes through the rules engine.</div>

      <div className="actions">
        <button type="button" onClick={back}>Back</button>
        <button type="button" onClick={() => setShowDivergence((current) => !current)}>{showDivergence ? 'Show agreement example' : 'Show divergence example'}</button>
        <button type="button" onClick={handleDownloadVpat} disabled={downloading}>{downloading ? 'Generating…' : 'Download VPAT'}</button>
      </div>
      <Callout id="demo2.callout.vpat">Downloads a real accessibility conformance snapshot generated from an axe-core scan of this page right now — not a static template.</Callout>
    </section>
  )
}
