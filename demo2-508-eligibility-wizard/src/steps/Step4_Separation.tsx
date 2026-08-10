import { useEffect, useMemo, useState } from 'react'
import { useAutoFocusHeading } from '../hooks/useAutoFocusHeading'
import { useWizardStore } from '../state/wizardStore'
import ReadingLevelMeter from '../a11y/ReadingLevelMeter'
import NvdaSimulator from '../a11y/NvdaSimulator'
import PlainLanguageChecklist from '../a11y/PlainLanguageChecklist'
import Callout from '../components/Callout'

function splitIso(iso: string) {
  const [year, month, day] = (iso || '2021-01-01').split('-')
  return { month: month ?? '01', day: day ?? '01', year: year ?? '2021' }
}

export default function Step4_Separation() {
  const headingRef = useAutoFocusHeading<HTMLHeadingElement>()
  const form = useWizardStore((state) => state.form)
  const setForm = useWizardStore((state) => state.setForm)
  const next = useWizardStore((state) => state.next)
  const back = useWizardStore((state) => state.back)
  const resumeSent = useWizardStore((state) => state.resumeSent)
  const setResumeSent = useWizardStore((state) => state.setResumeSent)

  const parts = splitIso(form.separationDate)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSaved(true)
      setResumeSent(true)
    }, 900)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updatePart = (part: 'month' | 'day' | 'year', value: string) => {
    const next = { ...parts, [part]: value }
    setForm({ separationDate: `${next.year}-${next.month.padStart(2, '0')}-${next.day.padStart(2, '0')}` })
  }

  const visibleText = useMemo(
    () => 'When did you separate from service? We use this to confirm your discharge is recent enough for certain benefits. Saved automatically. You can close this window and come back — we\'ll email you a resume link.',
    [],
  )

  return (
    <div className="separation-step">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          next()
        }}
      >
        <h2 ref={headingRef} tabIndex={-1}>When did you separate from service?</h2>
        <p>We use this to confirm your discharge is recent enough for certain benefits.</p>
        <fieldset className="date-parts">
          <legend>Separation date</legend>
          <label htmlFor="sep-month">Month
            <input id="sep-month" inputMode="numeric" maxLength={2} value={parts.month} onChange={(event) => updatePart('month', event.target.value)} />
          </label>
          <label htmlFor="sep-day">Day
            <input id="sep-day" inputMode="numeric" maxLength={2} value={parts.day} onChange={(event) => updatePart('day', event.target.value)} />
          </label>
          <label htmlFor="sep-year">Year
            <input id="sep-year" inputMode="numeric" maxLength={4} value={parts.year} onChange={(event) => updatePart('year', event.target.value)} />
          </label>
        </fieldset>

        <div className="resume-banner" role="status" aria-live="polite">
          {saved ? <p><strong>Saved automatically.</strong> You can close this window and come back — we'll email you a resume link.</p> : <p>Saving…</p>}
          {saved && (
            <>
              <label htmlFor="email">Email for save and resume</label>
              <input id="email" type="email" value={form.email} onChange={(event) => setForm({ email: event.target.value })} />
              <input readOnly aria-label="Resume token" value={resumeSent ? `resume:${form.email}` : ''} />
            </>
          )}
        </div>

        <div className="actions">
          <button type="button" onClick={back}>Back</button>
          <button type="submit">Continue</button>
        </div>
      </form>

      <div className="a11y-sidebar">
        <ReadingLevelMeter text={visibleText} />
        <Callout id="demo2.callout.readinglevel">A real Flesch-Kincaid score computed on the visible text of this step — this demo enforces an 8th-grade reading level, not just claims one.</Callout>
        <PlainLanguageChecklist />
        <NvdaSimulator />
        <Callout id="demo2.callout.nvda">Turn this on, then press Tab through the form above — it announces each control using NVDA's actual phrasing conventions ("Edit, Month, 03", "Alert: Saved automatically").</Callout>
      </div>
    </div>
  )
}
