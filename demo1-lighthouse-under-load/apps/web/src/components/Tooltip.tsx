import type { ReactNode } from 'react'
import { useContentOverrides } from '../lib/contentContext'

export default function Tooltip({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const overrides = useContentOverrides()
  const text = overrides[id] ?? label
  return (
    <span className="tooltip-wrap">
      {children}
      <span className="tooltip-bubble" role="tooltip">{text}</span>
    </span>
  )
}
