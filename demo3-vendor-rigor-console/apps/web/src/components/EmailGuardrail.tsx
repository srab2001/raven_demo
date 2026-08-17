import { useState } from 'react'
import Callout from './Callout'

export default function EmailGuardrail() {
  const [cc, setCc] = useState('')
  const [altInput, setAltInput] = useState('')
  const [showAltInput, setShowAltInput] = useState(false)
  const [showOverrideInput, setShowOverrideInput] = useState(false)
  const [justification, setJustification] = useState('')
  const [overrideLogged, setOverrideLogged] = useState(false)
  const [sendLog, setSendLog] = useState<string[]>([])

  const resolved = cc.trim().length > 0 || overrideLogged

  const addPdsContact = () => {
    setCc('pds-health-office@va.gov')
    setShowAltInput(false)
    setShowOverrideInput(false)
  }

  const confirmAltContact = () => {
    if (altInput.trim()) {
      setCc(altInput.trim())
      setShowAltInput(false)
    }
  }

  const confirmOverride = () => {
    if (justification.trim()) {
      setOverrideLogged(true)
      setSendLog((current) => [...current, `Override logged: "${justification.trim()}"`])
    }
  }

  const send = () => {
    setSendLog((current) => [...current, `Sent to jane.doe@va.gov${cc ? ` (cc: ${cc})` : ''} at ${new Date().toLocaleTimeString()}`])
  }

  return (
    <section className="panel-grid guardrail-grid">
      <article className="panel email-composer" data-tour="email-composer">
        <h2>Government email guardrail — composer extension</h2>
        <p className="subtext">Any outbound email to a *.va.gov contact outside PDS Health scans recipients before send.</p>
        <div className="mail-field"><span>To:</span><span>jane.doe@va.gov (Oracle Cutover Program)</span></div>
        <div className={`mail-field cc-field ${resolved ? '' : 'cc-missing'}`}>
          <span>Cc:</span>
          <span>{cc || '— guardrail suggests adding a PDS Health contact —'}</span>
        </div>
        <div className="mail-field"><span>Subject:</span><span>Follow-up on the Aug cutover — patient portal impact</span></div>
        <div className="mail-body">
          Hi Jane,
          <br /><br />
          Following up on our discussion re: the Oracle cutover window and downstream patient portal effects. We propose …
        </div>
        <button type="button" className="send-button" disabled={!resolved} onClick={send}>Send</button>
        {!resolved && <p className="hint">↑ blocked until CC is resolved</p>}
        <Callout id="demo3.callout.emailguardrail">Send stays disabled until the guardrail on the right is resolved — this demo enforces the CC policy, it doesn't just describe it.</Callout>
        {sendLog.length > 0 && (
          <ul className="send-log">
            {sendLog.map((entry, index) => <li key={index}>{entry}</li>)}
          </ul>
        )}
      </article>

      <aside className="panel guardrail-notice" data-tour="guardrail-notice">
        <h2>Guardrail notice</h2>
        <p>Recipient jane.doe@va.gov is outside PDS Health: Patient &amp; Clinical Experience.</p>
        <p><strong>Policy:</strong> Include a PDS Health contact on Cc before sending.</p>
        <button type="button" className="guardrail-add" onClick={addPdsContact}>Add pds-health-office@va.gov</button>
        {!showAltInput ? (
          <button type="button" onClick={() => setShowAltInput(true)}>Add a different PDS contact…</button>
        ) : (
          <div className="inline-input">
            <input value={altInput} onChange={(event) => setAltInput(event.target.value)} placeholder="name@va.gov" />
            <button type="button" onClick={confirmAltContact}>Use this contact</button>
          </div>
        )}
        {!showOverrideInput ? (
          <button type="button" className="guardrail-override" onClick={() => setShowOverrideInput(true)}>Override (log + justify)</button>
        ) : (
          <div className="inline-input">
            <textarea value={justification} onChange={(event) => setJustification(event.target.value)} placeholder="Justify why this send should bypass the guardrail" />
            <button type="button" onClick={confirmOverride}>Log override and unblock</button>
          </div>
        )}
        <p className="footnote">All sends logged • Overrides visible in weekly PDS Health digest • Zero-surprise policy enforced</p>
      </aside>
    </section>
  )
}
