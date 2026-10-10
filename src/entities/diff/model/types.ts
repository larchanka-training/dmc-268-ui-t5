export type DiffLineType = 'context' | 'add' | 'delete'

export type DiffSide = 'old' | 'new'

export type Severity = 'critical' | 'warning' | 'info'

export type DiffViewMode = 'unified' | 'split'

export type ReviewStatus = 'completed' | 'in_progress'

export type ReviewVerdict = 'approve' | 'changes_requested' | 'comment'

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
  severity?: Severity
  suggestion?: string
  isAI?: boolean
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
  sourceBranch: string
  targetBranch: string
  reviewStatus: ReviewStatus
  verdict: ReviewVerdict
  /** Общая оценка AI-ревью: 0–10 */
  score: number
  aiSummary: string
  files: FileChange[]
}
