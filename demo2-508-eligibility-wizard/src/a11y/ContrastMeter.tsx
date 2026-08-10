import { useEffect, useState } from 'react'

function parseRgb(color: string): [number, number, number, number] | null {
  const match = color.match(/rgba?\(([^)]+)\)/)
  if (!match) return null
  const parts = match[1].split(',').map((part) => parseFloat(part.trim()))
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1]
}

function relativeLuminance([r, g, b]: [number, number, number, number]): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(a: [number, number, number, number], b: [number, number, number, number]): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function backgroundOf(el: Element | null): [number, number, number, number] {
  let node: Element | null = el
  while (node) {
    const bg = parseRgb(getComputedStyle(node).backgroundColor)
    if (bg && bg[3] > 0) return bg
    node = node.parentElement
  }
  return [255, 255, 255, 1]
}

export default function ContrastMeter() {
  const [ratio, setRatio] = useState<number | null>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null
      if (!target || target === document.body) return
      const textColor = parseRgb(getComputedStyle(target).color)
      if (!textColor) return
      const bgColor = backgroundOf(target)
      setRatio(contrastRatio(textColor, bgColor))
      setLabel(target.tagName.toLowerCase())
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [])

  if (ratio === null) return null

  const passesAA = ratio >= 4.5
  return (
    <div className={`contrast-meter ${passesAA ? 'check-pass' : 'check-fail'}`} role="status">
      Contrast on focused {label}: {ratio.toFixed(1)}:1 {passesAA ? '(AA pass)' : '(below 4.5:1)'}
    </div>
  )
}
