import type { Hunk } from '../../model/types'
import { DiffLine } from '../diff-line/DiffLine'
import { ExpandableContext } from '../expandable-context/ExpandableContext'
import { InlineComment } from '../inline-comment/InlineComment'

export interface DiffHunkProps {
  hunk: Hunk
  lang: string
}

function commentMatchesLine(
  commentLine: number,
  commentSide: 'old' | 'new',
  line: { type: string; oldNumber?: number; newNumber?: number },
): boolean {
  const lineNumber = commentSide === 'old' ? line.oldNumber : line.newNumber
  const lineSide = line.type === 'delete' ? 'old' : 'new'
  return lineNumber === commentLine && lineSide === commentSide
}

export function DiffHunk({ hunk, lang }: DiffHunkProps) {
  return (
    <div data-testid="diff-hunk" className="overflow-hidden rounded-md border">
      <ExpandableContext
        hunkId={hunk.id}
        lines={hunk.contextLinesBefore}
        lang={lang}
        position="before"
      />
      <div className="bg-muted/20 px-3 py-1 font-mono text-xs text-muted-foreground">
        @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
      </div>
      <div>
        {hunk.lines.map((line, index) => (
          <div key={index}>
            <DiffLine line={line} lang={lang} />
            {hunk.comments
              .filter((comment) =>
                commentMatchesLine(comment.line, comment.side, line),
              )
              .map((comment) => (
                <InlineComment key={comment.id} comment={comment} />
              ))}
          </div>
        ))}
      </div>
      <ExpandableContext
        hunkId={hunk.id}
        lines={hunk.contextLinesAfter}
        lang={lang}
        position="after"
      />
    </div>
  )
}

export default DiffHunk
