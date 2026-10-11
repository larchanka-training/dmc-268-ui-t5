import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { FileChange, FileChangeStatus } from '../../model/types'
import { buildFileTree, type FileTreeNode } from '../../lib/buildFileTree'
import { countFileChanges } from '../../lib/countFileChanges'
import { getFileStatus } from '../../lib/getFileStatus'

const STATUS_MARKS: Record<FileChangeStatus, string> = {
  modified: '',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
}

const STATUS_MARK_STYLES: Record<FileChangeStatus, string> = {
  modified: '',
  added:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  deleted: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  renamed: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
}

const STATUS_TITLES: Record<FileChangeStatus, string> = {
  modified: '',
  added: 'Новый файл',
  deleted: 'Удалён',
  renamed: 'Переименован',
}

export interface FileTreeProps {
  files: FileChange[]
  activeFileId: string | null
  onFileSelect: (fileId: string) => void
}

interface FileTreeRowProps {
  active: boolean
  depth: number
  file: FileChange
  name: string
  onSelect: (fileId: string) => void
}

function FileTreeRow({
  active,
  depth,
  file,
  name,
  onSelect,
}: FileTreeRowProps) {
  const status = getFileStatus(file)
  const { added, deleted } = countFileChanges(file)
  const mark = STATUS_MARKS[status]

  return (
    <li
      className={cn(
        'flex items-center gap-2 rounded-md pr-2',
        active ? 'bg-accent' : 'hover:bg-accent/50',
      )}
      data-active={active}
    >
      <button
        aria-current={active ? 'true' : undefined}
        className="min-w-0 flex-1 truncate py-1 pl-2 pr-1 text-left text-sm"
        data-testid="file-tree-file"
        onClick={() => onSelect(file.id)}
        style={{ marginLeft: `${depth * 14}px` }}
        title={
          status === 'renamed'
            ? `${file.oldPath} → ${file.newPath}`
            : file.newPath
        }
        type="button"
      >
        {name}
      </button>
      {mark && (
        <span
          className={cn(
            'shrink-0 rounded px-1 font-mono text-[10px] font-bold',
            STATUS_MARK_STYLES[status],
          )}
          data-testid={`file-tree-status-${status}`}
          title={
            status === 'renamed'
              ? `Переименован: ${file.oldPath} → ${file.newPath}`
              : STATUS_TITLES[status]
          }
        >
          {mark}
        </span>
      )}
      <span className="shrink-0 font-mono text-xs">
        <span
          className={
            added > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground'
          }
        >
          +{added}
        </span>{' '}
        <span
          className={
            deleted > 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-muted-foreground'
          }
        >
          -{deleted}
        </span>
      </span>
    </li>
  )
}

export function FileTree({ files, activeFileId, onFileSelect }: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(files), [files])
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>(
    {},
  )

  const activeDirPaths = useMemo(() => {
    const paths = new Set<string>()
    if (!activeFileId) return paths
    const file = files.find((candidate) => candidate.id === activeFileId)
    if (!file) return paths
    const segments = file.newPath.split('/')
    for (let index = 1; index < segments.length; index += 1) {
      paths.add(segments.slice(0, index).join('/'))
    }
    return paths
  }, [activeFileId, files])

  const isDirExpanded = (path: string) =>
    !collapsedDirs[path] || activeDirPaths.has(path)

  const toggleDir = (path: string) => {
    setCollapsedDirs((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const renderNodes = (nodes: FileTreeNode[], depth: number) =>
    nodes.map((node) => {
      if (node.type === 'file') {
        return (
          <FileTreeRow
            active={node.file.id === activeFileId}
            depth={depth}
            file={node.file}
            key={node.file.id}
            name={node.name}
            onSelect={onFileSelect}
          />
        )
      }

      const expanded = isDirExpanded(node.path)

      return (
        <li key={node.path}>
          <button
            aria-expanded={expanded}
            className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-sm text-muted-foreground hover:bg-accent"
            data-testid="file-tree-dir"
            onClick={() => toggleDir(node.path)}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                'size-3.5 shrink-0 transition-transform',
                expanded && 'rotate-90',
              )}
            />
            <span className="truncate">{node.name}</span>
          </button>
          {expanded && (
            <ul className="mt-0.5 space-y-0.5">
              {renderNodes(node.children, depth + 1)}
            </ul>
          )}
        </li>
      )
    })

  return (
    <ul className="space-y-0.5" data-testid="file-tree">
      {renderNodes(tree, 0)}
    </ul>
  )
}

export default FileTree
