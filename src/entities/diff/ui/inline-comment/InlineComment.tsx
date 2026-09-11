import { Badge } from '@/shared/ui/badge'
import type { InlineComment as InlineCommentType } from '../../model/types'

export interface InlineCommentProps {
  comment: InlineCommentType
}

export function InlineComment({ comment }: InlineCommentProps) {
  return (
    <div
      className="my-1 border-l-2 border-primary/40 bg-muted/30 px-3 py-2"
      data-testid="inline-comment"
    >
      <div className="flex items-center justify-between gap-2">
        <strong className="text-sm">{comment.author}</strong>
        <Badge variant={comment.status === 'resolved' ? 'success' : 'warning'}>
          {comment.status === 'resolved' ? 'Решён' : 'Нерешён'}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
      <p className="mt-1 text-xs text-muted-foreground/60">
        Строка {comment.line} ({comment.side})
      </p>
    </div>
  )
}

export default InlineComment
