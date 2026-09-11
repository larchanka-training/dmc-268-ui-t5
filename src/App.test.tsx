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
import { getReviewComments } from './entities/review-comment/api/getReviewComments'
import { useReviewCommentsStore } from './entities/review-comment/model/reviewCommentsStore'

vi.mock('./entities/review-comment/api/getReviewComments', () => ({
  getReviewComments: vi.fn(async (shouldFail = false) => {
    if (shouldFail) {
      throw new Error('Не удалось загрузить review-комментарии')
    }

    return [
      { id: 1, author: 'Алексей', body: 'Первый комментарий', status: 'unresolved' },
      { id: 2, author: 'Мария', body: 'Второй комментарий', status: 'resolved' },
    ]
  }),
}))

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    useReviewCommentsStore.setState({ filter: 'all' })
    vi.clearAllMocks()
  })

  it('shows loading state before comments are available', () => {
    renderApp()

    expect(screen.getByRole('status')).toHaveTextContent(
      'Загрузка комментариев…',
    )
  })

  it('filters comments and toggles the theme', async () => {
    renderApp()

    await screen.findByText('Первый комментарий')
    fireEvent.click(screen.getByRole('button', { name: 'Решённые' }))

    expect(screen.queryByText('Первый комментарий')).not.toBeInTheDocument()
    expect(screen.getByText('Второй комментарий')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Включить тёмную тему' }),
    )
    await waitFor(() =>
      expect(document.documentElement).toHaveClass('dark'),
    )
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('shows an error and allows retrying', async () => {
    renderApp()

    await screen.findByText('Первый комментарий')
    fireEvent.click(screen.getByRole('button', { name: 'Симулировать ошибку' }))

    expect(
      await screen.findByText('Не удалось загрузить review-комментарии'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    await waitFor(() =>
      expect(screen.getByText('Первый комментарий')).toBeInTheDocument(),
    )
    expect(vi.mocked(getReviewComments)).toHaveBeenCalledWith(false)
  })
})
