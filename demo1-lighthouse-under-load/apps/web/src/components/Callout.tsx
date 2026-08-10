import type { ReactNode } from 'react'
import { useContentOverrides } from '../lib/contentContext'

export default function Callout({ id, children }: { id: string; children: ReactNode }) {
  const overrides = useContentOverrides()
  const text = overrides[id]
  return (
    <aside className="callout" role="note">
      <span className="callout-icon" aria-hidden="true">💬</span>
      <p>{text !== undefined ? text : children}</p>
    </aside>
  )
}
