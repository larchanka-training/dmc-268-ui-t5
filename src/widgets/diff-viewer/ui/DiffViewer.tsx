import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import type { FileChange } from '@/entities/diff/model/types'
import { DiffHunk } from '@/entities/diff/ui/diff-hunk/DiffHunk'

export interface DiffViewerProps {
  file: FileChange
}

export function DiffViewer({ file }: DiffViewerProps) {
  const added = file.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter((l) => l.type === 'add').length,
    0,
  )
  const deleted = file.hunks.reduce(
    (sum, hunk) => sum + hunk.lines.filter((l) => l.type === 'delete').length,
    0,
  )

  return (
    <Card data-testid="diff-viewer">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between gap-3">
          <code className="font-mono text-sm text-muted-foreground">
            {file.newPath}
          </code>
          <div className="flex gap-2">
            <Badge variant="success">+{added}</Badge>
            <Badge variant="warning">-{deleted}</Badge>
          </div>
        </div>
        <div className="space-y-2">
          {file.hunks.map((hunk) => (
            <DiffHunk key={hunk.id} hunk={hunk} lang={file.language} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default DiffViewer
