import { useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Moon, Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTheme } from '@/app/providers/theme-provider/ThemeProvider'
import { getReviewComments } from '@/entities/review-comment/api/getReviewComments'
import {
  useReviewCommentsStore,
  type ReviewCommentFilter,
} from '@/entities/review-comment/model/reviewCommentsStore'

export function App() {
  const filter = useReviewCommentsStore((state) => state.filter)
  const setFilter = useReviewCommentsStore((state) => state.setFilter)
  const simulateErrorRef = useRef(false)
  const { theme, toggleTheme } = useTheme()
  const { data, error, isError, isPending, refetch } = useQuery({
    queryKey: ['review-comments'],
    queryFn: () => getReviewComments(simulateErrorRef.current),
  })

  const visibleComments = useMemo(
    () =>
      data?.filter(
        (comment) => filter === 'all' || comment.status === filter,
      ) ?? [],
    [data, filter],
  )

  const handleSimulateError = () => {
    simulateErrorRef.current = true
    void refetch()
  }

  const handleRetry = () => {
    simulateErrorRef.current = false
    void refetch()
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-primary">
            DMC-268 Team 5 UI
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Review comments
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            TanStack Query хранит серверные данные, Zustand управляет фильтром.
          </p>
        </div>
        <Button
          aria-label={`Включить ${theme === 'light' ? 'тёмную' : 'светлую'} тему`}
          onClick={toggleTheme}
          size="icon"
          title={`Включить ${theme === 'light' ? 'тёмную' : 'светлую'} тему`}
          variant="secondary"
        >
          {theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          <span className="sr-only">Переключить тему</span>
        </Button>
      </header>

      <section
        aria-label="Фильтр комментариев"
        className="mb-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex gap-2">
          {(['all', 'unresolved', 'resolved'] as ReviewCommentFilter[]).map(
            (option) => (
              <Button
                aria-pressed={filter === option}
                key={option}
                onClick={() => setFilter(option)}
                size="sm"
                variant={filter === option ? 'default' : 'secondary'}
              >
                {option === 'all'
                  ? 'Все'
                  : option === 'unresolved'
                    ? 'Нерешённые'
                    : 'Решённые'}
              </Button>
            ),
          )}
        </div>
        <Button onClick={handleSimulateError} size="sm" variant="secondary">
          Симулировать ошибку
        </Button>
      </section>

      {isPending && (
        <Card role="status">
          <CardContent className="pt-6 text-muted-foreground">
            Загрузка комментариев…
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="border-destructive/40" role="alert">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Произошла ошибка'}
            </p>
            <Button className="mt-3" onClick={handleRetry} size="sm" variant="secondary">
              Повторить
            </Button>
          </CardContent>
        </Card>
      )}

      {!isPending && !isError && (
        <section>
          <p className="mb-4 text-muted-foreground">
            Найдено комментариев: <strong>{visibleComments.length}</strong>
          </p>
          <ul className="grid gap-3 p-0">
            {visibleComments.map((comment) => (
              <li key={comment.id}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{comment.author}</strong>
                      <Badge
                        variant={
                          comment.status === 'resolved' ? 'success' : 'warning'
                        }
                      >
                        {comment.status === 'resolved' ? 'Решён' : 'Нерешён'}
                      </Badge>
                    </div>
                    <p className="mt-3 text-muted-foreground">{comment.body}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

export default App
