import { cn } from '@/shared/lib/utils'
import {
  DIFF_LINE_CLASS,
  DIFF_SIGN,
  DIFF_SIGN_CLASS,
} from '../../lib/diffLineStyles'
import type {
  DiffLine,
  DiffSide,
  InlineComment as InlineCommentType,
} from '../../model/types'
import { InlineComment } from '../inline-comment/InlineComment'
import { LineTokens } from '../line-tokens/LineTokens'

function Side({
  line,
  side,
  lang,
}: {
  line: DiffLine | undefined
  side: DiffSide
  lang: string
}) {
  const type = line?.type ?? 'context'
  const sign =
    side === 'old'
      ? type === 'delete'
        ? DIFF_SIGN.delete
        : DIFF_SIGN.context
      : type === 'add'
        ? DIFF_SIGN.add
        : DIFF_SIGN.context

  const bgClass =
    line === undefined
      ? 'bg-muted/30'
      : type === 'delete' && side === 'old'
        ? DIFF_LINE_CLASS.delete
        : type === 'add' && side === 'new'
          ? DIFF_LINE_CLASS.add
          : DIFF_LINE_CLASS.context

  const number = side === 'old' ? line?.oldNumber : line?.newNumber

  return (
    <div className={cn('flex min-w-0 font-mono text-sm leading-6', bgClass)}>
      <span className="w-12 shrink-0 select-none border-r border-border/40 pr-1 text-right text-muted-foreground/50">
        {number ?? ''}
      </span>
      <span
        className={cn(
          'w-6 shrink-0 select-none text-center',
          DIFF_SIGN_CLASS[type],
        )}
      >
        {sign}
      </span>
      <LineTokens content={line?.content ?? ''} lang={lang} />
    </div>
  )
}

export interface DiffLinePairProps {
  oldLine: DiffLine | undefined
  newLine: DiffLine | undefined
  lang: string
  comments: InlineCommentType[]
}

export function DiffLinePair({
  oldLine,
  newLine,
  lang,
  comments,
}: DiffLinePairProps) {
  return (
    <div className="grid grid-cols-2" data-testid="diff-line-pair">
      <Side line={oldLine} side="old" lang={lang} />
      <Side line={newLine} side="new" lang={lang} />
      {comments.length > 0 && (
        <div className="col-span-2">
          {comments.map((comment) => (
            <InlineComment
              comment={comment}
              key={comment.id}
              lang={lang}
              lineContent={
                (comment.side === 'old' ? oldLine : newLine)?.content
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DiffLinePair
