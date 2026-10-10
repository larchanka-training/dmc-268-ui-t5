import type { FileChange, Severity } from '../model/types'

/** Считает AI-замечания по уровням серьёзности во всех файлах MR */
export function countSeverities(files: FileChange[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, warning: 0, info: 0 }

  for (const file of files) {
    for (const hunk of file.hunks) {
      for (const comment of hunk.comments) {
        if (comment.isAI && comment.severity) {
          counts[comment.severity] += 1
        }
      }
    }
  }

  return counts
}
