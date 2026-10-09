import { useMemo, type CSSProperties } from 'react'
import { cn } from '@/shared/lib/utils'
import { useShiki } from '@/shared/lib/shiki/useShiki'

export interface CodeProps {
  code: string
  lang: string
  showLineNumbers?: boolean
  className?: string
}

export function Code({
  code,
  lang,
  showLineNumbers = true,
  className,
}: CodeProps) {
  const { highlighter, ready, shikiTheme } = useShiki()

  const lines = useMemo(() => {
    const source = code.replace(/\n$/, '')
    const rawLines = source.split('\n')

    if (!ready || !highlighter) {
      return rawLines.map((line) => [
        { content: line, color: undefined as string | undefined },
      ])
    }

    try {
      return highlighter.codeToTokensBase(source, {
        lang: lang as never,
        theme: shikiTheme,
      })
    } catch {
      return rawLines.map((line) => [
        { content: line, color: undefined as string | undefined },
      ])
    }
  }, [code, lang, ready, highlighter, shikiTheme])

  return (
    <code
      className={cn(
        'block overflow-x-auto rounded-md bg-muted/30 p-3 font-mono text-sm leading-6',
        className,
      )}
      data-testid="code-block"
    >
      {lines.map((tokens, lineIndex) => (
        <span key={lineIndex} className="flex">
          {showLineNumbers && (
            <span
              aria-hidden="true"
              className="mr-4 inline-block w-8 select-none text-right text-muted-foreground/60"
            >
              {lineIndex + 1}
            </span>
          )}
          <span className="flex-1 whitespace-pre">
            {tokens.length === 0 ? (
              <span>{'\u200B'}</span>
            ) : (
              tokens.map((token, tokenIndex) => (
                <span
                  key={tokenIndex}
                  style={
                    token.color
                      ? ({ color: token.color } as CSSProperties)
                      : undefined
                  }
                >
                  {token.content}
                </span>
              ))
            )}
          </span>
        </span>
      ))}
    </code>
  )
}

export default Code
