import { useEffect, useRef, useState } from 'react'

type Caption = { id: string; text: string }

function labelFor(el: Element): string {
  const aria = el.getAttribute('aria-label')
  if (aria) return aria
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`)
    if (label?.textContent) return label.textContent.trim()
  }
  const closestLabel = el.closest('label')
  if (closestLabel?.textContent) return closestLabel.textContent.replace((el as HTMLElement).innerText ?? '', '').trim()
  return (el.getAttribute('placeholder') || el.textContent || '').trim().slice(0, 80)
}

function announcementFor(el: Element): string | null {
  const tag = el.tagName.toLowerCase()

  if (/^h[1-6]$/.test(tag)) {
    const level = tag[1]
    return `Heading, level ${level}: "${el.textContent?.trim()}"`
  }

  if (tag === 'input') {
    const input = el as HTMLInputElement
    if (input.type === 'radio') {
      return `Radio button, ${labelFor(input)}, ${input.checked ? 'checked' : 'not checked'}`
    }
    if (input.type === 'checkbox') {
      return `Check box, ${labelFor(input)}, ${input.checked ? 'checked' : 'not checked'}`
    }
    return `Edit, ${labelFor(input)}, ${input.value || 'blank'}`
  }

  if (tag === 'select') {
    const select = el as HTMLSelectElement
    return `Combo box, ${labelFor(select)}, ${select.options[select.selectedIndex]?.text ?? ''}`
  }

  if (tag === 'button') {
    return `Button, ${el.textContent?.trim()}`
  }

  if (tag === 'a') {
    return `Link, ${el.textContent?.trim()}`
  }

  return null
}

export default function NvdaSimulator() {
  const [enabled, setEnabled] = useState(false)
  const [captions, setCaptions] = useState<Caption[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  const speak = (text: string) => {
    if (!enabled) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.35
      window.speechSynthesis.speak(utterance)
    } catch {
      // Speech synthesis unavailable (headless/sandboxed browser) — captions still work.
    }
  }

  const announce = (text: string) => {
    setCaptions((current) => [...current.slice(-7), { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text }])
    speak(text)
  }

  useEffect(() => {
    if (!enabled) return

    const onFocus = (event: FocusEvent) => {
      const target = event.target as Element | null
      if (!target) return
      const text = announcementFor(target)
      if (text) announce(text)
    }
    document.addEventListener('focusin', onFocus)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as Element
        const liveRegion = target.closest?.('[aria-live]') ?? (target.getAttribute?.('aria-live') ? target : null)
        if (liveRegion && liveRegion.textContent?.trim()) {
          announce(`Alert: "${liveRegion.textContent.trim()}"`)
        }
      }
    })
    document.querySelectorAll('[aria-live]').forEach((node) => observer.observe(node, { childList: true, characterData: true, subtree: true }))

    return () => {
      document.removeEventListener('focusin', onFocus)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [captions])

  return (
    <aside className="nvda-panel">
      <label className="nvda-toggle">
        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
        NVDA simulator
      </label>
      {enabled && (
        <div className="nvda-captions" ref={listRef} aria-hidden="true">
          {captions.length === 0 && <p>Tab into the form to hear announcements.</p>}
          {captions.map((caption) => (
            <p key={caption.id}>{caption.text}</p>
          ))}
        </div>
      )}
    </aside>
  )
}
