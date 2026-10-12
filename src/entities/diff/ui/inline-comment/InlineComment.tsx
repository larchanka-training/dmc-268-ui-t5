import { useState } from 'react'
import { Bot, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import type { InlineComment as InlineCommentType } from '../../model/types'
import { DiffSuggestion } from '../diff-suggestion/DiffSuggestion'
import { SeverityBadge } from '../severity-badge/SeverityBadge'

export interface InlineCommentProps {
  comment: InlineCommentType
  lang: string
  /** Содержимое строки, к которой привязано замечание (для мини-диффа suggestion) */
  lineContent?: string
}

export function InlineComment({
  comment,
  lang,
  lineContent,
}: InlineCommentProps) {
  const [expanded, setExpanded] = useState(true)

  const Chevron = expanded ? ChevronDown : ChevronRight

  return (
    <div
      className="my-1 border-l-2 border-primary/40 bg-muted/30 px-3 py-2"
      data-testid="inline-comment"
    >
      <button
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 text-left"
        data-testid="inline-comment-toggle"
        onClick={() => setExpanded((value) => !value)}
        type="button"
      >
        <span className="flex flex-wrap items-center gap-2">
          {comment.isAI && (
            <Badge className="gap-1" variant="secondary">
              <Bot aria-hidden="true" size={12} />
              AI
            </Badge>
          )}
          <strong className="text-sm">{comment.author}</strong>
          {comment.severity && <SeverityBadge severity={comment.severity} />}
          <Badge
            variant={comment.status === 'resolved' ? 'success' : 'warning'}
          >
            {comment.status === 'resolved' ? 'Решён' : 'Нерешён'}
          </Badge>
        </span>
        <Chevron
          aria-hidden="true"
          className="shrink-0 text-muted-foreground"
          size={16}
        />
      </button>
      {expanded && (
        <div data-testid="inline-comment-body">
          <p className="mt-1 text-sm text-muted-foreground">{comment.body}</p>
          {comment.suggestion !== undefined && lineContent !== undefined && (
            <DiffSuggestion
              lang={lang}
              lineContent={lineContent}
              suggestion={comment.suggestion}
            />
          )}
          <p className="mt-1 text-xs text-muted-foreground/60">
            Строка {comment.line} ({comment.side})
          </p>
        </div>
      )}
    </div>
  )
}

export default InlineComment
