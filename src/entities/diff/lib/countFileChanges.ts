import type { FileChange } from '../model/types'

/** Считает добавленные и удалённые строки по всем хункам файла. */
export function countFileChanges(file: FileChange): {
  added: number
  deleted: number
} {
  let added = 0
  let deleted = 0

  for (const hunk of file.hunks) {
    for (const line of hunk.lines) {
      if (line.type === 'add') added += 1
      else if (line.type === 'delete') deleted += 1
    }
  }

  return { added, deleted }
}
