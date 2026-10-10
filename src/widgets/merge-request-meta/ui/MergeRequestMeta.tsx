import { ArrowRight, Bot, GitBranch } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { countSeverities } from '@/entities/diff/lib/countSeverities'
import type {
  MergeRequest,
  ReviewStatus,
  ReviewVerdict,
  Severity,
} from '@/entities/diff/model/types'
import { SeverityBadge } from '@/entities/diff/ui/severity-badge/SeverityBadge'

const REVIEW_STATUS: Record<
  ReviewStatus,
  { label: string; variant: BadgeVariant }
> = {
  completed: { label: 'Ревью завершено', variant: 'success' },
  in_progress: { label: 'Ревью выполняется', variant: 'warning' },
}

const VERDICT: Record<ReviewVerdict, { label: string; variant: BadgeVariant }> =
  {
    approve: { label: 'Одобрено', variant: 'success' },
    changes_requested: { label: 'Нужны правки', variant: 'destructive' },
    comment: { label: 'Комментарий', variant: 'secondary' },
  }

const SEVERITY_ORDER: Severity[] = ['critical', 'warning', 'info']

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export interface MergeRequestMetaProps {
  mergeRequest: MergeRequest
}

export function MergeRequestMeta({ mergeRequest }: MergeRequestMetaProps) {
  const status = REVIEW_STATUS[mergeRequest.reviewStatus]
  const verdict = VERDICT[mergeRequest.verdict]
  const severityCounts = countSeverities(mergeRequest.files)
  const hasFindings = SEVERITY_ORDER.some(
    (severity) => severityCounts[severity] > 0,
  )

  return (
    <Card data-testid="merge-request-meta">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            >
              {initials(mergeRequest.author)}
            </span>
            <div>
              <h2 className="text-lg font-semibold leading-tight">
                {mergeRequest.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                автор: {mergeRequest.author}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={verdict.variant}>{verdict.label}</Badge>
            <Badge variant="secondary">Оценка: {mergeRequest.score}/10</Badge>
          </div>
        </div>

        <p className="flex flex-wrap items-center gap-2 font-mono text-sm text-muted-foreground">
          <GitBranch aria-hidden="true" size={16} />
          <span>{mergeRequest.sourceBranch}</span>
          <ArrowRight aria-hidden="true" size={14} />
          <span>{mergeRequest.targetBranch}</span>
        </p>

        {hasFindings && (
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="severity-counters"
          >
            {SEVERITY_ORDER.map((severity) => (
              <span className="inline-flex items-center gap-1" key={severity}>
                <SeverityBadge severity={severity} />
                <span className="text-sm font-semibold">
                  {severityCounts[severity]}
                </span>
              </span>
            ))}
          </div>
        )}

        <div className="rounded-md border bg-muted/30 px-3 py-2">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Bot aria-hidden="true" size={14} />
            Сводка AI-ревью
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mergeRequest.aiSummary}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default MergeRequestMeta
