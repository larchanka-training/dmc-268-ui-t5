import type { MergeRequest } from '../model/types'

const mergeRequest: MergeRequest = {
  id: 42,
  title: 'Refactor: extract review comment store',
  author: 'Алексей',
  files: [
    {
      id: 'src-store-ts',
      oldPath: 'src/store.ts',
      newPath: 'src/store.ts',
      language: 'typescript',
      hunks: [
        {
          id: 'src-store-ts-h1',
          oldStart: 10,
          oldLines: 4,
          newStart: 10,
          newLines: 6,
          contextLinesBefore: [
            { type: 'context', oldNumber: 7, newNumber: 7, content: 'import { create } from "zustand"' },
            { type: 'context', oldNumber: 8, newNumber: 8, content: '' },
            { type: 'context', oldNumber: 9, newNumber: 9, content: 'export type State = {' },
          ],
          lines: [
            { type: 'context', oldNumber: 10, newNumber: 10, content: '  filter: Filter' },
            { type: 'delete', oldNumber: 11, content: '  comments: Comment[]' },
            { type: 'add', newNumber: 11, content: '  expandedHunks: Record<string, boolean>' },
            { type: 'add', newNumber: 12, content: '  selectedFileId: string | null' },
            { type: 'context', oldNumber: 12, newNumber: 13, content: '}' },
          ],
          comments: [
            {
              id: 1,
              line: 11,
              side: 'new',
              author: 'Мария',
              body: 'comments больше не хранятся в UI-стейте — теперь через TanStack Query.',
              status: 'resolved',
            },
          ],
          contextLinesAfter: [
            { type: 'context', oldNumber: 13, newNumber: 14, content: '' },
            { type: 'context', oldNumber: 14, newNumber: 15, content: 'export const useStore = create<State>()(...)' },
          ],
        },
      ],
    },
    {
      id: 'src-utils-ts',
      oldPath: 'src/utils.ts',
      newPath: 'src/shared/lib/utils.ts',
      language: 'typescript',
      hunks: [
        {
          id: 'src-utils-ts-h1',
          oldStart: 1,
          oldLines: 3,
          newStart: 1,
          newLines: 4,
          contextLinesBefore: [],
          lines: [
            { type: 'add', newNumber: 1, content: 'import { clsx } from "clsx"' },
            { type: 'add', newNumber: 2, content: 'import { twMerge } from "tailwind-merge"' },
            { type: 'add', newNumber: 3, content: '' },
            { type: 'add', newNumber: 4, content: 'export function cn(...inputs: ClassValue[]) {' },
          ],
          comments: [
            {
              id: 2,
              line: 4,
              side: 'new',
              author: 'Иван',
              body: 'Файл переехал в shared/lib — соответствует строгому FSD.',
              status: 'unresolved',
            },
          ],
          contextLinesAfter: [],
        },
      ],
    },
  ],
}

export async function getMergeRequest(shouldFail = false): Promise<MergeRequest> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (shouldFail) {
    throw new Error('Не удалось загрузить merge request')
  }

  return mergeRequest
}
