import { useAutoFocusHeading } from '../hooks/useAutoFocusHeading'
import { useWizardStore, type WizardForm } from '../state/wizardStore'

const OPTIONS: Array<{ value: WizardForm['housingStatus']; label: string }> = [
  { value: 'Stable', label: 'In my own home or apartment' },
  { value: 'At risk', label: 'With family or friends temporarily' },
  { value: 'Homeless', label: 'In a shelter, vehicle, or outside' },
]

export default function Step3_Housing() {
  const headingRef = useAutoFocusHeading<HTMLHeadingElement>()
  const form = useWizardStore((state) => state.form)
  const setForm = useWizardStore((state) => state.setForm)
  const next = useWizardStore((state) => state.next)
  const back = useWizardStore((state) => state.back)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        next()
      }}
    >
      <h2 ref={headingRef} tabIndex={-1}>Where are you staying tonight?</h2>
      <p>This helps us match you to the right housing benefit.</p>
      <fieldset>
        <legend className="visually-hidden">Housing situation</legend>
        {OPTIONS.map((option) => (
          <label key={option.value} className="radio-row radio-card">
            <input
              type="radio"
              name="housingStatus"
              value={option.value}
              checked={form.housingStatus === option.value}
              onChange={() => setForm({ housingStatus: option.value })}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <div className="actions">
        <button type="button" onClick={back}>Back</button>
        <button type="submit">Continue</button>
      </div>
    </form>
  )
}
