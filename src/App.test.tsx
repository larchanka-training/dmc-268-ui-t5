import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ThemeProvider } from './app/providers/theme-provider/ThemeProvider'
import { ShikiProvider } from './shared/lib/shiki/ShikiProvider'
import { getMergeRequest } from './entities/diff/api/getMergeRequest'
import { useDiffUiStore } from './entities/diff/model/diffUiStore'

vi.mock('./entities/diff/api/getMergeRequest', () => ({
  getMergeRequest: vi.fn(async (shouldFail = false) => {
    if (shouldFail) {
      throw new Error('Не удалось загрузить merge request')
    }

    return {
      id: 42,
      title: 'Refactor: extract review comment store',
      author: 'Алексей',
      sourceBranch: 'feature/issue-2',
      targetBranch: 'main',
      reviewStatus: 'completed',
      verdict: 'changes_requested',
      score: 6,
      aiSummary: 'Найдена одна критичная проблема.',
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
              oldLines: 1,
              newStart: 10,
              newLines: 2,
              contextLinesBefore: [],
              lines: [
                {
                  type: 'context',
                  oldNumber: 10,
                  newNumber: 10,
                  content: 'ctx',
                },
                { type: 'add', newNumber: 11, content: 'const a = 1' },
              ],
              contextLinesAfter: [],
              comments: [
                {
                  id: 1,
                  line: 11,
                  side: 'new',
                  author: 'Мария',
                  body: 'комментарий ревьюера',
                  status: 'resolved',
                },
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
              oldLines: 0,
              newStart: 1,
              newLines: 1,
              contextLinesBefore: [],
              lines: [
                {
                  type: 'add',
                  newNumber: 1,
                  content: 'export function cn() {}',
                },
              ],
              contextLinesAfter: [],
              comments: [],
            },
          ],
        },
      ],
    }
  }),
}))

vi.mock('./shared/lib/shiki/useShiki', () => ({
  useShiki: () => ({
    highlighter: {
      codeToTokensBase: (code: string) => [
        [{ content: code, color: undefined }],
      ],
    },
    ready: true,
    shikiTheme: 'github-light',
  }),
}))

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ShikiProvider>
          <App />
        </ShikiProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('App (MergeRequestPage)', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    useDiffUiStore.setState({
      expandedHunks: {},
      selectedFileId: null,
      viewMode: 'unified',
    })
    vi.clearAllMocks()
  })

  it('shows loading state before the merge request is available', () => {
    renderApp()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Загрузка merge request…',
    )
  })

  it('renders the diff viewer with inline comment', async () => {
    renderApp()

    expect(await screen.findByText('const a = 1')).toBeInTheDocument()
    expect(screen.getByTestId('diff-viewer')).toBeInTheDocument()
    expect(screen.getByText('Мария')).toBeInTheDocument()
    expect(screen.getByText('комментарий ревьюера')).toBeInTheDocument()
  })

  it('renders the merge request meta card', async () => {
    renderApp()

    expect(await screen.findByTestId('merge-request-meta')).toBeInTheDocument()
    expect(screen.getByText('Нужны правки')).toBeInTheDocument()
    expect(screen.getByText('Оценка: 6/10')).toBeInTheDocument()
    expect(screen.getByText('feature/issue-2')).toBeInTheDocument()
    expect(screen.getByText('main')).toBeInTheDocument()
  })

  it('switches between unified and side-by-side view modes', async () => {
    renderApp()

    await screen.findByText('const a = 1')
    expect(screen.getAllByTestId('diff-line').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('diff-line-pair')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Side-by-side' }))

    expect(screen.getAllByTestId('diff-line-pair').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('diff-line')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Unified' }))

    expect(screen.getAllByTestId('diff-line').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('diff-line-pair')).not.toBeInTheDocument()
  })

  it('switches between files', async () => {
    renderApp()

    await screen.findByText('const a = 1')
    fireEvent.click(
      screen.getByRole('button', { name: 'src/shared/lib/utils.ts' }),
    )

    expect(screen.getByText('export function cn() {}')).toBeInTheDocument()
  })

  it('toggles the theme and persists it', async () => {
    renderApp()

    await screen.findByText('const a = 1')
    fireEvent.click(
      screen.getByRole('button', { name: 'Включить тёмную тему' }),
    )

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('shows an error and allows retrying', async () => {
    renderApp()

    await screen.findByText('const a = 1')
    fireEvent.click(screen.getByRole('button', { name: 'Симулировать ошибку' }))

    expect(
      await screen.findByText('Не удалось загрузить merge request'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Повторить' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    await waitFor(() =>
      expect(screen.getByText('const a = 1')).toBeInTheDocument(),
    )
    expect(vi.mocked(getMergeRequest)).toHaveBeenCalledWith(false)
  })
})
