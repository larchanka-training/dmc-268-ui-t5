import type { DiffLine } from '../model/types'

export type LinePair = {
  old?: DiffLine
  new?: DiffLine
}

/**
 * Строит пары old/new для side-by-side режима:
 * удаления объединяются с последующими добавлениями,
 * контекстные строки попадают в обе стороны.
 */
export function buildLinePairs(lines: DiffLine[]): LinePair[] {
  const pairs: LinePair[] = []
  const pendingDeletes: DiffLine[] = []

  const flushDeletes = () => {
    for (const old of pendingDeletes.splice(0)) {
      pairs.push({ old })
    }
  }

  for (const line of lines) {
    if (line.type === 'delete') {
      pendingDeletes.push(line)
    } else if (line.type === 'add') {
      const old = pendingDeletes.shift()
      pairs.push(old ? { old, new: line } : { new: line })
    } else {
      flushDeletes()
      pairs.push({ old: line, new: line })
    }
  }

  flushDeletes()
  return pairs
}
