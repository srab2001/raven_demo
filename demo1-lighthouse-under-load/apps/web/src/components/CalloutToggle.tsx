import { useEffect, useState } from 'react'

const STORAGE_KEY = 'demo1.showGuide'

export default function CalloutToggle() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const shouldShow = stored !== 'hidden'
    setVisible(shouldShow)
    document.body.classList.toggle('callouts-hidden', !shouldShow)
  }, [])

  const toggle = () => {
    const next = !visible
    setVisible(next)
    document.body.classList.toggle('callouts-hidden', !next)
    localStorage.setItem(STORAGE_KEY, next ? 'shown' : 'hidden')
  }

  return (
    <button type="button" className="callout-toggle" onClick={toggle} aria-pressed={visible}>
      {visible ? 'Hide guide' : 'Show guide'}
    </button>
  )
}
