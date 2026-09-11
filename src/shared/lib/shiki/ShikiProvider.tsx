import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Highlighter } from 'shiki'
import { useTheme } from '@/app/providers/theme-provider/ThemeProvider'
import { getHighlighter, resolveShikiTheme, type ShikiTheme } from './shiki'

export type ShikiContextValue = {
  highlighter: Highlighter | null
  ready: boolean
  shikiTheme: ShikiTheme
}

const ShikiContext = createContext<ShikiContextValue | undefined>(undefined)

export function ShikiProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)

  useEffect(() => {
    let active = true
    void getHighlighter().then((h) => {
      if (active) setHighlighter(h)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <ShikiContext.Provider
      value={{
        highlighter,
        ready: highlighter !== null,
        shikiTheme: resolveShikiTheme(theme),
      }}
    >
      {children}
    </ShikiContext.Provider>
  )
}

export { ShikiContext }
