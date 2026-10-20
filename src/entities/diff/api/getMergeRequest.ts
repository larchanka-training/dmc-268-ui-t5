import type { MergeRequest } from '../model/types'

const mergeRequest: MergeRequest = {
  id: 42,
  title: 'Refactor: extract review comment store',
  author: 'Алексей',
  sourceBranch: 'feature/issue-2',
  targetBranch: 'main',
  reviewStatus: 'completed',
  verdict: 'changes_requested',
  score: 6,
  aiSummary:
    'Рефакторинг переносит комментарии из глобального Zustand-стейта в TanStack Query и переносит утилиты в shared/lib. Общая структура соответствует FSD, но найдена одна критичная проблема с обработкой ошибок доступа к localStorage и несколько замечаний по надёжности.',
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
            {
              type: 'context',
              oldNumber: 7,
              newNumber: 7,
              content: 'import { create } from "zustand"',
            },
            { type: 'context', oldNumber: 8, newNumber: 8, content: '' },
            {
              type: 'context',
              oldNumber: 9,
              newNumber: 9,
              content: 'export type State = {',
            },
          ],
          lines: [
            {
              type: 'context',
              oldNumber: 10,
              newNumber: 10,
              content: '  filter: Filter',
            },
            { type: 'delete', oldNumber: 11, content: '  comments: Comment[]' },
            {
              type: 'add',
              newNumber: 11,
              content: '  expandedHunks: Record<string, boolean>',
            },
            {
              type: 'add',
              newNumber: 12,
              content: '  selectedFileId: string | null',
            },
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
            {
              id: 3,
              line: 12,
              side: 'new',
              author: 'GitLab Duo',
              isAI: true,
              severity: 'critical',
              body: 'selectedFileId читается из localStorage без try/catch: в приватном режиме браузера обращение к localStorage бросает исключение и ломает инициализацию стора.',
              status: 'unresolved',
              suggestion: '  selectedFileId: string | undefined',
            },
            {
              id: 4,
              line: 11,
              side: 'new',
              author: 'GitLab Duo',
              isAI: true,
              severity: 'warning',
              body: 'expandedHunks растёт неограниченно при переключении файлов — стоит сбрасывать записи при смене merge request, иначе память утекает на длинных сессиях.',
              status: 'unresolved',
            },
            {
              id: 5,
              line: 11,
              side: 'old',
              author: 'GitLab Duo',
              isAI: true,
              severity: 'info',
              body: 'Поле comments удалено из стейта: убедитесь, что добавлена миграция со старого формата persisted-state, иначе пользователи получат несовместимый снапшот.',
              status: 'unresolved',
            },
          ],
          contextLinesAfter: [
            { type: 'context', oldNumber: 13, newNumber: 14, content: '' },
            {
              type: 'context',
              oldNumber: 14,
              newNumber: 15,
              content: 'export const useStore = create<State>()(...)',
            },
          ],
        },
      ],
    },
    {
      id: 'src-utils-ts',
      oldPath: 'src/utils.ts',
      newPath: 'src/shared/lib/utils.ts',
      status: 'renamed',
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
            {
              type: 'add',
              newNumber: 1,
              content: 'import { clsx } from "clsx"',
            },
            {
              type: 'add',
              newNumber: 2,
              content: 'import { twMerge } from "tailwind-merge"',
            },
            { type: 'add', newNumber: 3, content: '' },
            {
              type: 'add',
              newNumber: 4,
              content: 'export function cn(...inputs: ClassValue[]) {',
            },
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
            {
              id: 6,
              line: 4,
              side: 'new',
              author: 'GitLab Duo',
              isAI: true,
              severity: 'warning',
              body: 'У публичного helper нет явного возвращаемого типа — inference выведет его из реализации, и любое изменение тела молча поменяет контракт.',
              status: 'unresolved',
              suggestion:
                'export function cn(...inputs: ClassValue[]): string {',
            },
          ],
          contextLinesAfter: [],
        },
      ],
    },
    {
      id: 'src-shared-lib-format-ts',
      oldPath: 'src/shared/lib/format.ts',
      newPath: 'src/shared/lib/format.ts',
      status: 'added',
      language: 'typescript',
      hunks: [
        {
          id: 'src-shared-lib-format-ts-h1',
          oldStart: 0,
          oldLines: 0,
          newStart: 1,
          newLines: 5,
          contextLinesBefore: [],
          lines: [
            {
              type: 'add',
              newNumber: 1,
              content: 'export function formatDate(date: Date): string {',
            },
            {
              type: 'add',
              newNumber: 2,
              content: '  return date.toLocaleDateString("ru-RU")',
            },
            { type: 'add', newNumber: 3, content: '}' },
            { type: 'add', newNumber: 4, content: '' },
            {
              type: 'add',
              newNumber: 5,
              content: 'export function formatNumber(value: number): string {',
            },
          ],
          comments: [
            {
              id: 7,
              line: 2,
              side: 'new',
              author: 'GitLab Duo',
              isAI: true,
              severity: 'info',
              body: 'toLocaleDateString зависит от настроек локали среды выполнения — для стабильных снапшотов тестов лучше передавать локаль явно.',
              status: 'unresolved',
            },
          ],
          contextLinesAfter: [],
        },
      ],
    },
    {
      id: 'src-shared-ui-button-tsx',
      oldPath: 'src/shared/ui/button.tsx',
      newPath: 'src/shared/ui/button.tsx',
      language: 'typescript',
      hunks: [
        {
          id: 'src-shared-ui-button-tsx-h1',
          oldStart: 5,
          oldLines: 3,
          newStart: 5,
          newLines: 4,
          contextLinesBefore: [],
          lines: [
            {
              type: 'context',
              oldNumber: 5,
              newNumber: 5,
              content: "import { cn } from '@/shared/lib/utils'",
            },
            {
              type: 'delete',
              oldNumber: 6,
              content: "import { cn } from '@/utils'",
            },
            {
              type: 'add',
              newNumber: 6,
              content: '',
            },
            {
              type: 'context',
              oldNumber: 7,
              newNumber: 8,
              content: 'const buttonVariants = cva(',
            },
          ],
          comments: [],
          contextLinesAfter: [],
        },
      ],
    },
    {
      id: 'src-shared-ui-code-code-tsx',
      oldPath: 'src/shared/ui/code/Code.tsx',
      newPath: 'src/shared/ui/code/Code.tsx',
      language: 'typescript',
      hunks: [
        {
          id: 'src-shared-ui-code-code-tsx-h1',
          oldStart: 12,
          oldLines: 2,
          newStart: 12,
          newLines: 2,
          contextLinesBefore: [],
          lines: [
            {
              type: 'context',
              oldNumber: 12,
              newNumber: 12,
              content: 'export function Code({ children }: CodeProps) {',
            },
            {
              type: 'add',
              newNumber: 13,
              content: '  const tokens = useLineTokens(children, lang)',
            },
            { type: 'delete', oldNumber: 13, content: '  const parts = children.split("")' },
          ],
          comments: [],
          contextLinesAfter: [],
        },
      ],
    },
    {
      id: 'src-pages-merge-request-page-tsx',
      oldPath: 'src/pages/merge-request/ui/MergeRequestPage.tsx',
      newPath: 'src/pages/merge-request/ui/MergeRequestPage.tsx',
      language: 'typescript',
      hunks: [
        {
          id: 'src-pages-merge-request-page-tsx-h1',
          oldStart: 46,
          oldLines: 2,
          newStart: 46,
          newLines: 3,
          contextLinesBefore: [],
          lines: [
            {
              type: 'context',
              oldNumber: 46,
              newNumber: 46,
              content: '  return (',
            },
            {
              type: 'delete',
              oldNumber: 47,
              content: '    <main className="max-w-5xl">',
            },
            {
              type: 'add',
              newNumber: 47,
              content: '    <main className="mx-auto max-w-7xl px-6 py-12">',
            },
            {
              type: 'add',
              newNumber: 48,
              content: '      <FileTree files={data.files} />',
            },
          ],
          comments: [
            {
              id: 8,
              line: 48,
              side: 'new',
              author: 'Мария',
              body: 'Двухпанельный лэйаут как в GitLab — дерево файлов слева.',
              status: 'resolved',
            },
          ],
          contextLinesAfter: [],
        },
      ],
    },
    {
      id: 'src-widgets-diff-viewer-tsx',
      oldPath: 'src/widgets/diff-viewer/ui/DiffViewer.tsx',
      newPath: 'src/widgets/diff-viewer/ui/DiffViewer.tsx',
      language: 'typescript',
      hunks: [
        {
          id: 'src-widgets-diff-viewer-tsx-h1',
          oldStart: 11,
          oldLines: 3,
          newStart: 11,
          newLines: 4,
          contextLinesBefore: [],
          lines: [
            {
              type: 'context',
              oldNumber: 11,
              newNumber: 11,
              content: 'export function DiffViewer({ file }: DiffViewerProps) {',
            },
            {
              type: 'add',
              newNumber: 12,
              content: '  const status = getFileStatus(file)',
            },
            {
              type: 'add',
              newNumber: 13,
              content: '  const { added, deleted } = countFileChanges(file)',
            },
            {
              type: 'context',
              oldNumber: 12,
              newNumber: 15,
              content: '',
            },
          ],
          comments: [],
          contextLinesAfter: [],
        },
      ],
    },
    {
      id: 'vite-config-ts',
      oldPath: 'vite.config.ts',
      newPath: 'vite.config.ts',
      language: 'typescript',
      hunks: [
        {
          id: 'vite-config-ts-h1',
          oldStart: 1,
          oldLines: 3,
          newStart: 1,
          newLines: 4,
          contextLinesBefore: [],
          lines: [
            {
              type: 'context',
              oldNumber: 1,
              newNumber: 1,
              content: "import { defineConfig } from 'vite'",
            },
            {
              type: 'add',
              newNumber: 2,
              content: "import tailwindcss from '@tailwindcss/vite'",
            },
            {
              type: 'context',
              oldNumber: 2,
              newNumber: 3,
              content: "import react from '@vitejs/plugin-react'",
            },
            {
              type: 'context',
              oldNumber: 3,
              newNumber: 4,
              content: '',
            },
          ],
          comments: [],
          contextLinesAfter: [],
        },
      ],
    },
    {
      id: 'package-json',
      oldPath: 'package.json',
      newPath: 'package.json',
      language: 'json',
      hunks: [
        {
          id: 'package-json-h1',
          oldStart: 30,
          oldLines: 2,
          newStart: 30,
          newLines: 2,
          contextLinesBefore: [],
          lines: [
            {
              type: 'context',
              oldNumber: 30,
              newNumber: 30,
              content: '  "dependencies": {',
            },
            {
              type: 'add',
              newNumber: 31,
              content: '    "zustand": "^5.0.2",',
            },
            {
              type: 'context',
              oldNumber: 31,
              newNumber: 32,
              content: '    "@tanstack/react-query": "^5.59.0"',
            },
          ],
          comments: [],
          contextLinesAfter: [],
        },
      ],
    },
    {
      id: 'docs-architecture-md',
      oldPath: 'docs/architecture.md',
      newPath: 'docs/architecture.md',
      status: 'deleted',
      language: 'markdown',
      hunks: [
        {
          id: 'docs-architecture-md-h1',
          oldStart: 1,
          oldLines: 4,
          newStart: 0,
          newLines: 0,
          contextLinesBefore: [],
          lines: [
            {
              type: 'delete',
              oldNumber: 1,
              content: '# Архитектура проекта',
            },
            {
              type: 'delete',
              oldNumber: 2,
              content: '',
            },
            {
              type: 'delete',
              oldNumber: 3,
              content: 'Документ устарел: актуальное описание слоёв — в src/FRONTEND_ARCHITECTURE.md.',
            },
          ],
          comments: [],
          contextLinesAfter: [],
        },
      ],
    },
  ],
}

export async function getMergeRequest(
  shouldFail = false,
): Promise<MergeRequest> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (shouldFail) {
    throw new Error('Не удалось загрузить merge request')
  }

  return mergeRequest
}
