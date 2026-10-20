import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import type { FileChange } from '@/entities/diff/model/types'
import { useDiffUiStore } from '@/entities/diff/model/diffUiStore'
import { countFileChanges } from '@/entities/diff/lib/countFileChanges'
import { getFileStatus } from '@/entities/diff/lib/getFileStatus'
import { DiffHunk } from '@/entities/diff/ui/diff-hunk/DiffHunk'

export interface DiffViewerProps {
  file: FileChange
}

export function DiffViewer({ file }: DiffViewerProps) {
  const viewMode = useDiffUiStore((state) => state.viewMode)
  const status = getFileStatus(file)
  const { added, deleted } = countFileChanges(file)

  return (
    <Card data-testid="diff-viewer">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between gap-3">
          <code className="break-all font-mono text-sm text-muted-foreground">
            {status === 'renamed'
              ? `${file.oldPath} → ${file.newPath}`
              : file.newPath}
          </code>
          <div className="flex shrink-0 gap-2">
            {status === 'added' && <Badge variant="success">Новый</Badge>}
            {status === 'deleted' && <Badge variant="destructive">Удалён</Badge>}
            {status === 'renamed' && <Badge variant="info">Переименован</Badge>}
            <Badge variant="success">+{added}</Badge>
            <Badge variant="warning">-{deleted}</Badge>
          </div>
        </div>
        <div className="space-y-2">
          {file.hunks.map((hunk) => (
            <DiffHunk
              hunk={hunk}
              key={hunk.id}
              lang={file.language}
              viewMode={viewMode}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default DiffViewer
