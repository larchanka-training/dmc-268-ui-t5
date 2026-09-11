import { useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReviewComments } from './entities/review-comment/api/getReviewComments'
import {
  useReviewCommentsStore,
  type ReviewCommentFilter,
} from './entities/review-comment/model/reviewCommentsStore'

export function App() {
  const filter = useReviewCommentsStore((state) => state.filter)
  const setFilter = useReviewCommentsStore((state) => state.setFilter)
  const simulateErrorRef = useRef(false)
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
    <main className="app">
      <header>
        <p className="eyebrow">DMC-268 Team 5 UI</p>
        <h1>Review comments</h1>
        <p className="description">
          TanStack Query хранит серверные данные, Zustand управляет фильтром.
        </p>
      </header>

      <section className="toolbar" aria-label="Фильтр комментариев">
        <div className="filters">
          {(['all', 'unresolved', 'resolved'] as ReviewCommentFilter[]).map(
            (option) => (
              <button
                className={filter === option ? 'filter active' : 'filter'}
                key={option}
                onClick={() => setFilter(option)}
                type="button"
              >
                {option === 'all'
                  ? 'Все'
                  : option === 'unresolved'
                    ? 'Нерешённые'
                    : 'Решённые'}
              </button>
            ),
          )}
        </div>
        <button
          className="secondary-button"
          onClick={handleSimulateError}
          type="button"
        >
          Симулировать ошибку
        </button>
      </section>

      {isPending && <p className="status">Загрузка комментариев…</p>}

      {isError && (
        <div className="status error" role="alert">
          <p>{error instanceof Error ? error.message : 'Произошла ошибка'}</p>
          <button
            className="secondary-button"
            onClick={handleRetry}
            type="button"
          >
            Повторить
          </button>
        </div>
      )}

      {!isPending && !isError && (
        <section>
          <p className="results-count">
            Найдено комментариев: <strong>{visibleComments.length}</strong>
          </p>
          <ul className="comments">
            {visibleComments.map((comment) => (
              <li className="comment" key={comment.id}>
                <div className="comment-heading">
                  <strong>{comment.author}</strong>
                  <span className={`badge ${comment.status}`}>
                    {comment.status === 'resolved' ? 'Решён' : 'Нерешён'}
                  </span>
                </div>
                <p>{comment.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

export default App
