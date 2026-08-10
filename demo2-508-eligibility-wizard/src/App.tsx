import './App.css'
import { STEPS, useWizardStore } from './state/wizardStore'
import Step1_Discharge from './steps/Step1_Discharge'
import Step2_ServiceDates from './steps/Step2_ServiceDates'
import Step3_Housing from './steps/Step3_Housing'
import Step4_Separation from './steps/Step4_Separation'
import Result from './steps/Result'
import AxePanel from './a11y/AxePanel'
import ContrastMeter from './a11y/ContrastMeter'

const STEP_COMPONENTS: Record<string, () => JSX.Element> = {
  discharge: Step1_Discharge,
  serviceDates: Step2_ServiceDates,
  housing: Step3_Housing,
  separation: Step4_Separation,
  result: Result,
}

function App() {
  const step = useWizardStore((state) => state.step)
  const currentStepIndex = STEPS.findIndex((item) => item.key === step)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100
  const StepComponent = STEP_COMPONENTS[step]

  return (
    <>
      <a className="skip-link" href="#wizard-main">Skip to content</a>
      <main className="app-shell">
        <header className="hero-card">
          <p className="eyebrow">Demo 2</p>
          <h1>508-First Eligibility Wizard</h1>
          <p>A keyboard-first wizard with a live accessibility panel and plain-language outcome view.</p>
          <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={currentStepIndex + 1} aria-label={`Step ${currentStepIndex + 1} of ${STEPS.length}`}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="step-count">Step {currentStepIndex + 1} of {STEPS.length}</p>
        </header>

        <div className="wizard-layout">
          <section className="wizard-card" id="wizard-main">
            <StepComponent />
          </section>
          <AxePanel runKey={step} />
        </div>
      </main>
      <ContrastMeter />
    </>
  )
}

export default App
