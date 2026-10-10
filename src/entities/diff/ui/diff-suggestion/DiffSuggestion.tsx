import { cn } from '@/shared/lib/utils'
import {
  DIFF_LINE_CLASS,
  DIFF_SIGN,
  DIFF_SIGN_CLASS,
} from '../../lib/diffLineStyles'
import { LineTokens } from '../line-tokens/LineTokens'

export interface DiffSuggestionProps {
  lang: string
  lineContent: string
  suggestion: string
}

function SuggestionRow({
  content,
  lang,
  type,
}: {
  content: string
  lang: string
  type: 'delete' | 'add'
}) {
  return (
    <div
      className={cn(
        'flex font-mono text-sm leading-6',
        type === 'delete' ? DIFF_LINE_CLASS.delete : DIFF_LINE_CLASS.add,
      )}
      data-suggestion-side={type === 'delete' ? 'old' : 'new'}
    >
      <span
        className={cn(
          'w-6 shrink-0 select-none text-center',
          DIFF_SIGN_CLASS[type],
        )}
      >
        {DIFF_SIGN[type]}
      </span>
      <LineTokens content={content} lang={lang} />
    </div>
  )
}

export function DiffSuggestion({
  lang,
  lineContent,
  suggestion,
}: DiffSuggestionProps) {
  return (
    <div
      className="mt-2 overflow-hidden rounded-md border"
      data-testid="diff-suggestion"
    >
      <p className="bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
        Предлагаемое изменение
      </p>
      <SuggestionRow content={lineContent} lang={lang} type="delete" />
      <SuggestionRow content={suggestion} lang={lang} type="add" />
    </div>
  )
}

export default DiffSuggestion
