import { useMemo } from 'react'
import type { DiffViewMode, Hunk } from '../../model/types'
import { buildLinePairs } from '../../lib/buildLinePairs'
import { DiffLine } from '../diff-line/DiffLine'
import { DiffLinePair } from '../diff-line-pair/DiffLinePair'
import { ExpandableContext } from '../expandable-context/ExpandableContext'
import { InlineComment } from '../inline-comment/InlineComment'

export interface DiffHunkProps {
  hunk: Hunk
  lang: string
  viewMode?: DiffViewMode
}

function commentMatchesLine(
  commentLine: number,
  commentSide: 'old' | 'new',
  line: { type: string; oldNumber?: number; newNumber?: number } | undefined,
): boolean {
  if (!line) return false
  const lineNumber = commentSide === 'old' ? line.oldNumber : line.newNumber
  const lineSide = line.type === 'delete' ? 'old' : 'new'
  return lineNumber === commentLine && lineSide === commentSide
}

export function DiffHunk({ hunk, lang, viewMode = 'unified' }: DiffHunkProps) {
  const pairs = useMemo(
    () => (viewMode === 'split' ? buildLinePairs(hunk.lines) : []),
    [viewMode, hunk.lines],
  )

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
      {viewMode === 'unified' ? (
        <div>
          {hunk.lines.map((line, index) => (
            <div key={index}>
              <DiffLine line={line} lang={lang} />
              {hunk.comments
                .filter((comment) =>
                  commentMatchesLine(comment.line, comment.side, line),
                )
                .map((comment) => (
                  <InlineComment
                    comment={comment}
                    key={comment.id}
                    lang={lang}
                    lineContent={line.content}
                  />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {pairs.map((pair, index) => (
            <DiffLinePair
              comments={hunk.comments.filter(
                (comment) =>
                  commentMatchesLine(comment.line, comment.side, pair.old) ||
                  commentMatchesLine(comment.line, comment.side, pair.new),
              )}
              key={index}
              lang={lang}
              newLine={pair.new}
              oldLine={pair.old}
            />
          ))}
        </div>
      )}
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
