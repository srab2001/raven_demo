import { useMemo, useState } from 'react'
import './App.css'

type StepKey = 'discharge' | 'housing' | 'separation' | 'result'

type WizardState = {
  dischargeStatus: string
  startDate: string
  endDate: string
  housingStatus: string
  separationDate: string
  email: string
}

const initialState: WizardState = {
  dischargeStatus: 'Honorable',
  startDate: '2024-01-01',
  endDate: '2024-01-10',
  housingStatus: 'Stable',
  separationDate: '2024-01-10',
  email: 'veteran@example.com',
}

const steps: Array<{ key: StepKey; title: string }> = [
  { key: 'discharge', title: 'Discharge status' },
  { key: 'housing', title: 'Housing situation' },
  { key: 'separation', title: 'Separation date' },
  { key: 'result', title: 'Result' },
]

function App() {
  const [step, setStep] = useState<StepKey>('discharge')
  const [form, setForm] = useState<WizardState>(initialState)
  const [resumeSent, setResumeSent] = useState(false)

  const currentStepIndex = steps.findIndex((item) => item.key === step)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const recommendation = useMemo(() => {
    if (form.dischargeStatus === 'Honorable' && form.housingStatus === 'Stable') {
      return 'HUD-VASH'
    }
    if (form.housingStatus === 'At risk') {
      return 'SSVF'
    }
    return 'VA Health Care'
  }, [form.dischargeStatus, form.housingStatus])

  const handleNext = () => {
    if (step === 'discharge') setStep('housing')
    else if (step === 'housing') setStep('separation')
    else if (step === 'separation') setStep('result')
  }

  const handleBack = () => {
    if (step === 'housing') setStep('discharge')
    else if (step === 'separation') setStep('housing')
    else if (step === 'result') setStep('separation')
  }

  const handleCreateResume = () => {
    setResumeSent(true)
  }

  return (
    <main className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">Demo 2</p>
        <h1>508-First Eligibility Wizard</h1>
        <p>A keyboard-first wizard with a live accessibility panel and plain-language outcome view.</p>
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={currentStepIndex + 1}>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <section className="wizard-card">
        <h2>{steps[currentStepIndex]?.title}</h2>
        {step === 'discharge' && (
          <form onSubmit={(event) => { event.preventDefault(); handleNext() }}>
            <label htmlFor="discharge">Discharge status</label>
            <select id="discharge" value={form.dischargeStatus} onChange={(event) => setForm({ ...form, dischargeStatus: event.target.value })}>
              <option value="Honorable">Honorable</option>
              <option value="General">General</option>
              <option value="Other">Other</option>
            </select>
            <label htmlFor="startDate">Start date</label>
            <input id="startDate" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            <label htmlFor="endDate">End date</label>
            <input id="endDate" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            <div className="actions"><button type="submit">Continue</button></div>
          </form>
        )}

        {step === 'housing' && (
          <form onSubmit={(event) => { event.preventDefault(); handleNext() }}>
            <fieldset>
              <legend>Housing situation</legend>
              <label><input type="radio" name="housing" value="Stable" checked={form.housingStatus === 'Stable'} onChange={() => setForm({ ...form, housingStatus: 'Stable' })} /> Stable</label>
              <label><input type="radio" name="housing" value="At risk" checked={form.housingStatus === 'At risk'} onChange={() => setForm({ ...form, housingStatus: 'At risk' })} /> At risk</label>
              <label><input type="radio" name="housing" value="Homeless" checked={form.housingStatus === 'Homeless'} onChange={() => setForm({ ...form, housingStatus: 'Homeless' })} /> Homeless</label>
            </fieldset>
            <div className="actions"><button type="button" onClick={handleBack}>Back</button><button type="submit">Continue</button></div>
          </form>
        )}

        {step === 'separation' && (
          <form onSubmit={(event) => { event.preventDefault(); handleNext() }}>
            <label htmlFor="separationDate">Separation date</label>
            <input id="separationDate" type="date" value={form.separationDate} onChange={(event) => setForm({ ...form, separationDate: event.target.value })} />
            <label htmlFor="email">Email for save and resume</label>
            <input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <div className="actions"><button type="button" onClick={handleBack}>Back</button><button type="submit">Continue</button></div>
          </form>
        )}

        {step === 'result' && (
          <section>
            <div className="alert" role="status">Recommendation: <strong>{recommendation}</strong></div>
            <div className="resume-banner">
              <p>{resumeSent ? 'Resume token generated and ready to send.' : 'Save and come back later.'}</p>
              <input readOnly aria-label="Resume token" value={`resume:${form.email}`} />
              <button type="button" onClick={handleCreateResume}>{resumeSent ? 'Refresh token' : 'Create resume token'}</button>
            </div>
            <div className="results-grid">
              <article className="result-card"><h3>Rules mode</h3><p>Discharge: {form.dischargeStatus}</p><p>Housing: {form.housingStatus}</p><p>Separation: {form.separationDate}</p></article>
              <article className="result-card"><h3>AI mode</h3><p>Recommendation: {recommendation}</p><p>Confidence: 0.91</p><p>Citations: 38 CFR § 3.12, VHA Directive 1160</p></article>
            </div>
            <div className="actions"><button type="button" onClick={handleBack}>Back</button></div>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
