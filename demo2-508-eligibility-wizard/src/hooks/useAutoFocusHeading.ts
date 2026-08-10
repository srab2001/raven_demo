import { useEffect, useRef } from 'react'

/** Moves focus to the step heading on mount so screen reader users are told what changed (a standard SPA-navigation a11y pattern). */
export function useAutoFocusHeading<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return ref
}
