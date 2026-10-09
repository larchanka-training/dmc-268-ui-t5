import { ChevronDown, ChevronRight } from 'lucide-react'
import { useDiffUiStore } from '../../model/diffUiStore'
import type { DiffLine as DiffLineType } from '../../model/types'
import { DiffLine } from '../diff-line/DiffLine'

export interface ExpandableContextProps {
  hunkId: string
  lines: DiffLineType[]
  lang: string
  position: 'before' | 'after'
}

export function ExpandableContext({
  hunkId,
  lines,
  lang,
  position,
}: ExpandableContextProps) {
  const expanded = useDiffUiStore((state) => state.expandedHunks[hunkId] ?? false)
  const toggleHunk = useDiffUiStore((state) => state.toggleHunk)

  if (lines.length === 0) return null

  return (
    <div data-testid={`expandable-context-${position}`}>
      <button
        type="button"
        onClick={() => toggleHunk(hunkId)}
        className="flex w-full items-center gap-1 bg-muted/40 px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
        aria-expanded={expanded}
        aria-label={expanded ? 'Свернуть контекст' : 'Раскрыть контекст'}
      >
        {expanded ? (
          <ChevronDown aria-hidden="true" size={12} />
        ) : (
          <ChevronRight aria-hidden="true" size={12} />
        )}
        {expanded
          ? 'Свернуть контекст'
          : `Показать ${lines.length} строк контекста`}
      </button>
      {expanded && (
        <div>
          {lines.map((line, index) => (
            <DiffLine key={index} line={line} lang={lang} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ExpandableContext
