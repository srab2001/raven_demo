import { useAutoFocusHeading } from '../hooks/useAutoFocusHeading'
import { useWizardStore } from '../state/wizardStore'

export default function Step1_Discharge() {
  const headingRef = useAutoFocusHeading<HTMLHeadingElement>()
  const form = useWizardStore((state) => state.form)
  const setForm = useWizardStore((state) => state.setForm)
  const next = useWizardStore((state) => state.next)

  const options: Array<{ value: typeof form.dischargeStatus; label: string }> = [
    { value: 'Honorable', label: 'Honorable' },
    { value: 'General', label: 'General' },
    { value: 'Other', label: 'Other than honorable' },
  ]

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        next()
      }}
    >
      <h2 ref={headingRef} tabIndex={-1}>What was your character of discharge?</h2>
      <p>This determines which benefit programs you can be routed to.</p>
      <fieldset>
        <legend className="visually-hidden">Character of discharge</legend>
        {options.map((option) => (
          <label key={option.value} className="radio-row">
            <input
              type="radio"
              name="dischargeStatus"
              value={option.value}
              checked={form.dischargeStatus === option.value}
              onChange={() => setForm({ dischargeStatus: option.value })}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <div className="actions">
        <button type="submit">Continue</button>
      </div>
    </form>
  )
}
