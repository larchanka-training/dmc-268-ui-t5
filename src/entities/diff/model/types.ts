export type DiffLineType = 'context' | 'add' | 'delete'

export type DiffSide = 'old' | 'new'

export type DiffLine = {
  type: DiffLineType
  oldNumber?: number
  newNumber?: number
  content: string
}

export type InlineComment = {
  id: number
  line: number
  side: DiffSide
  author: string
  body: string
  status: 'resolved' | 'unresolved'
}

export type Hunk = {
  id: string
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
  comments: InlineComment[]
  contextLinesBefore: DiffLine[]
  contextLinesAfter: DiffLine[]
}

export type FileChange = {
  id: string
  oldPath: string
  newPath: string
  language: string
  hunks: Hunk[]
}

export type MergeRequest = {
  id: number
  title: string
  author: string
  files: FileChange[]
}
