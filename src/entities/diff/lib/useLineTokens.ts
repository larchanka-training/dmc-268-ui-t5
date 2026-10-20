import { useMemo } from 'react'
import { useShiki } from '@/shared/lib/shiki/useShiki'

export type LineToken = {
  content: string
  color?: string
}

export function useLineTokens(content: string, lang: string): LineToken[] {
  const { highlighter, ready, shikiTheme } = useShiki()

  return useMemo(() => {
    if (!ready || !highlighter) {
      return [{ content }]
    }
    try {
      const lines = highlighter.codeToTokensBase(content, {
        lang: lang as never,
        theme: shikiTheme,
      })
      return lines[0] ?? [{ content }]
    } catch {
      return [{ content }]
    }
  }, [content, lang, ready, highlighter, shikiTheme])
}
