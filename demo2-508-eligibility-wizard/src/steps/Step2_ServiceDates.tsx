import { useAutoFocusHeading } from '../hooks/useAutoFocusHeading'
import { useWizardStore } from '../state/wizardStore'

export default function Step2_ServiceDates() {
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
      <h2 ref={headingRef} tabIndex={-1}>When did you serve?</h2>
      <p>Enter the start and end date of your period of service.</p>
      <label htmlFor="startDate">Start date</label>
      <input id="startDate" type="date" value={form.startDate} onChange={(event) => setForm({ startDate: event.target.value })} />
      <label htmlFor="endDate">End date</label>
      <input id="endDate" type="date" value={form.endDate} onChange={(event) => setForm({ endDate: event.target.value })} />
      <div className="actions">
        <button type="button" onClick={back}>Back</button>
        <button type="submit">Continue</button>
      </div>
    </form>
  )
}
