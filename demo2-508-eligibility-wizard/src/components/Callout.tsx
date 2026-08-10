import type { ReactNode } from 'react'

export default function Callout({ children }: { children: ReactNode }) {
  return (
    <aside className="callout" role="note">
      <span className="callout-icon" aria-hidden="true">💬</span>
      <p>{children}</p>
    </aside>
  )
}
