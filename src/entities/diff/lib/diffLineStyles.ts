import type { DiffLineType } from '../model/types'

export const DIFF_SIGN: Record<DiffLineType, string> = {
  context: ' ',
  add: '+',
  delete: '-',
}

export const DIFF_SIGN_CLASS: Record<DiffLineType, string> = {
  context: 'text-muted-foreground/40',
  add: 'text-emerald-600 dark:text-emerald-400',
  delete: 'text-rose-600 dark:text-rose-400',
}

export const DIFF_LINE_CLASS: Record<DiffLineType, string> = {
  context: 'bg-transparent',
  add: 'bg-emerald-500/10',
  delete: 'bg-rose-500/10',
}
