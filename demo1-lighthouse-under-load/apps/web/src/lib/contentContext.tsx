import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const ContentContext = createContext<Record<string, string>>({})

export function ContentProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/content')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.overrides) setOverrides(data.overrides)
      })
      .catch(() => {
        // No override endpoint reachable — components fall back to their built-in defaults.
      })
  }, [])

  return <ContentContext.Provider value={overrides}>{children}</ContentContext.Provider>
}

export function useContentOverrides(): Record<string, string> {
  return useContext(ContentContext)
}
