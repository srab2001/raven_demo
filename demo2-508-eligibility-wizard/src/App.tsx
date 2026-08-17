import { useState } from 'react'
import './App.css'
import { STEPS, useWizardStore } from './state/wizardStore'
import Step1_Discharge from './steps/Step1_Discharge'
import Step2_ServiceDates from './steps/Step2_ServiceDates'
import Step3_Housing from './steps/Step3_Housing'
import Step4_Separation from './steps/Step4_Separation'
import Result from './steps/Result'
import AxePanel from './a11y/AxePanel'
import ContrastMeter from './a11y/ContrastMeter'
import Callout from './components/Callout'
import CalloutToggle from './components/CalloutToggle'
import { GuidedTour, type TourStep } from './components/GuidedTour'
import { ContentProvider } from './lib/contentContext'

const STEP_COMPONENTS: Record<string, () => JSX.Element> = {
  discharge: Step1_Discharge,
  serviceDates: Step2_ServiceDates,
  housing: Step3_Housing,
  separation: Step4_Separation,
  result: Result,
}

function App() {
  const step = useWizardStore((state) => state.step)
  const setStep = useWizardStore((state) => state.setStep)
  const currentStepIndex = STEPS.findIndex((item) => item.key === step)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100
  const StepComponent = STEP_COMPONENTS[step]

  const [tourActive, setTourActive] = useState(false)

  const TOUR_STEPS: TourStep[] = [
    {
      selector: '[data-tour="hero"]',
      title: 'Welcome to the 508-First Eligibility Wizard',
      body: 'This wizard is built keyboard- and screen-reader-first, with a live accessibility panel proving it rather than just claiming it. This tour covers every part of the page; skip ahead or go back any time.',
      beforeShow: () => setStep('discharge'),
    },
    {
      selector: '[data-tour="wizard-main"]',
      title: 'One question per screen',
      body: 'Each step asks exactly one question — usable with a keyboard alone or a screen reader, not just visually. Tab through this step to feel the focus order.',
      beforeShow: () => setStep('discharge'),
    },
    {
      selector: '[data-tour="axe-panel"]',
      title: 'Live axe-core panel',
      body: "This runs a real axe-core scan against the current page on every step — it's a live result, not a canned checklist. It re-runs as you move through the wizard.",
    },
    {
      selector: '[data-tour="reading-level"]',
      title: 'Reading-level meter',
      body: 'A real Flesch-Kincaid score computed on this step\'s visible text — this demo enforces an 8th-grade reading level, not just claims one.',
      beforeShow: () => setStep('separation'),
    },
    {
      selector: '[data-tour="nvda-simulator"]',
      title: 'NVDA simulator',
      body: 'Turn this on, then Tab through the form above — it announces each control using NVDA\'s actual phrasing conventions ("Edit, Month, 03", "Alert: Saved automatically").',
      beforeShow: () => setStep('separation'),
    },
    {
      selector: '[data-tour="engine-toggle"]',
      title: 'Rules vs. AI',
      body: 'Rules mode runs a deterministic, 38 CFR-cited decision table. AI mode explains the same result with citations — try "Show divergence example" to see what happens when they disagree.',
      beforeShow: () => setStep('result'),
    },
    {
      selector: '[data-tour="vpat-download"]',
      title: 'Download a live VPAT',
      body: 'Downloads a real accessibility conformance snapshot generated from an axe-core scan of this page right now — not a static template.',
      beforeShow: () => setStep('result'),
    },
  ]

  return (
    <ContentProvider>
    <>
      <a className="skip-link" href="#wizard-main">Skip to content</a>
      <main className="app-shell">
        <header className="hero-card" data-tour="hero">
          <div className="hero-head">
            <div>
              <p className="eyebrow">Demo 2</p>
              <h1>508-First Eligibility Wizard</h1>
            </div>
            <button type="button" className="tour-button" onClick={() => setTourActive(true)}>Take the tour</button>
          </div>
          <p>A keyboard-first wizard with a live accessibility panel and plain-language outcome view.</p>
          <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={currentStepIndex + 1} aria-label={`Step ${currentStepIndex + 1} of ${STEPS.length}`}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="step-count">Step {currentStepIndex + 1} of {STEPS.length}</p>
          <Callout id="demo2.callout.intro">Each step asks exactly one question — this wizard is designed to be usable with a keyboard alone or a screen reader, not just visually.</Callout>
        </header>

        <div className="wizard-layout">
          <section className="wizard-card" id="wizard-main" data-tour="wizard-main">
            <StepComponent />
          </section>
          <div data-tour="axe-panel">
            <AxePanel runKey={step} />
            <Callout id="demo2.callout.axepanel">This runs a real axe-core scan against the current page on every step — it's a live result, not a canned checklist.</Callout>
          </div>
        </div>
      </main>
      <ContrastMeter />
      <CalloutToggle />
      <GuidedTour steps={TOUR_STEPS} active={tourActive} onClose={() => setTourActive(false)} />
    </>
    </ContentProvider>
  )
}

export default App
