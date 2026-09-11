import { useMemo, type CSSProperties } from 'react'
import { cn } from '@/shared/lib/utils'
import { useShiki } from '@/shared/lib/shiki/useShiki'
import type { DiffLine as DiffLineType } from '../../model/types'

const SIGN: Record<DiffLineType['type'], string> = {
  context: ' ',
  add: '+',
  delete: '-',
}

const LINE_CLASS: Record<DiffLineType['type'], string> = {
  context: 'bg-transparent',
  add: 'bg-emerald-500/10',
  delete: 'bg-rose-500/10',
}

const SIGN_CLASS: Record<DiffLineType['type'], string> = {
  context: 'text-muted-foreground/40',
  add: 'text-emerald-600 dark:text-emerald-400',
  delete: 'text-rose-600 dark:text-rose-400',
}

export interface DiffLineProps {
  line: DiffLineType
  lang: string
}

export function DiffLine({ line, lang }: DiffLineProps) {
  const { highlighter, ready, shikiTheme } = useShiki()

  const tokens = useMemo(() => {
    if (!ready || !highlighter) {
      return [{ content: line.content, color: undefined as string | undefined }]
    }
    try {
      const lines = highlighter.codeToTokensBase(line.content, {
        lang: lang as never,
        theme: shikiTheme,
      })
      return lines[0] ?? [{ content: line.content, color: undefined as string | undefined }]
    } catch {
      return [{ content: line.content, color: undefined as string | undefined }]
    }
  }, [line.content, lang, ready, highlighter, shikiTheme])

  return (
    <div
      className={cn('flex font-mono text-sm leading-6', LINE_CLASS[line.type])}
      data-testid="diff-line"
      data-line-type={line.type}
    >
      <span className="w-10 shrink-0 select-none text-right text-muted-foreground/50">
        {line.oldNumber ?? ''}
      </span>
      <span className="w-10 shrink-0 select-none text-right text-muted-foreground/50">
        {line.newNumber ?? ''}
      </span>
      <span
        className={cn('w-6 shrink-0 select-none text-center', SIGN_CLASS[line.type])}
      >
        {SIGN[line.type]}
      </span>
      <span className="flex-1 whitespace-pre">
        {tokens.length === 0 ? (
          <span>{'\u200B'}</span>
        ) : (
          tokens.map((token, index) => (
            <span
              key={index}
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
    </div>
  )
}

export default DiffLine
