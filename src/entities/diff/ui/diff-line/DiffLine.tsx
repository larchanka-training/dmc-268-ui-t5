import { cn } from '@/shared/lib/utils'
import {
  DIFF_LINE_CLASS,
  DIFF_SIGN,
  DIFF_SIGN_CLASS,
} from '../../lib/diffLineStyles'
import type { DiffLine as DiffLineType } from '../../model/types'
import { LineTokens } from '../line-tokens/LineTokens'

export interface DiffLineProps {
  line: DiffLineType
  lang: string
}

export function DiffLine({ line, lang }: DiffLineProps) {
  return (
    <div
      className={cn(
        'flex font-mono text-sm leading-6',
        DIFF_LINE_CLASS[line.type],
      )}
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
        className={cn(
          'w-6 shrink-0 select-none text-center',
          DIFF_SIGN_CLASS[line.type],
        )}
      >
        {DIFF_SIGN[line.type]}
      </span>
      <LineTokens content={line.content} lang={lang} />
    </div>
  )
}

export default DiffLine
