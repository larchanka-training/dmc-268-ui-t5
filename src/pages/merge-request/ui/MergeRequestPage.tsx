import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { useTheme } from '@/app/providers/theme-provider/ThemeProvider'
import { getMergeRequest } from '@/entities/diff/api/getMergeRequest'
import { useDiffUiStore } from '@/entities/diff/model/diffUiStore'
import { DiffViewer } from '@/widgets/diff-viewer/ui/DiffViewer'

export function MergeRequestPage() {
  const selectedFileId = useDiffUiStore((state) => state.selectedFileId)
  const setSelectedFile = useDiffUiStore((state) => state.setSelectedFile)
  const simulateErrorRef = useRef(false)
  const { theme, toggleTheme } = useTheme()
  const { data, error, isError, isPending, refetch } = useQuery({
    queryKey: ['merge-request'],
    queryFn: () => getMergeRequest(simulateErrorRef.current),
  })

  useEffect(() => {
    if (data && selectedFileId === null) {
      setSelectedFile(data.files[0]?.id ?? '')
    }
  }, [data, selectedFileId, setSelectedFile])

  const selectedFile = useMemo(
    () => data?.files.find((file) => file.id === selectedFileId) ?? data?.files[0],
    [data, selectedFileId],
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
    <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-primary">
            DMC-268 Team 5 UI
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Merge request
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Просмотрщик дифа с подсветкой синтаксиса (Shiki), inline-комментариями
            ревьюера и раскрывающимся контекстом.
          </p>
        </div>
        <Button
          aria-label={`Включить ${theme === 'light' ? 'тёмную' : 'светлую'} тему`}
          onClick={toggleTheme}
          size="icon"
          title={`Включить ${theme === 'light' ? 'тёмную' : 'светлую'} тему`}
          variant="secondary"
        >
          {theme === 'light' ? (
            <Moon aria-hidden="true" />
          ) : (
            <Sun aria-hidden="true" />
          )}
          <span className="sr-only">Переключить тему</span>
        </Button>
      </header>

      {data && (
        <p className="mb-6 text-lg font-semibold">
          {data.title}
          <span className="ml-3 text-sm font-normal text-muted-foreground">
            автор: {data.author}
          </span>
        </p>
      )}

      {data && data.files.length > 1 && (
        <nav aria-label="Файлы" className="mb-6 flex flex-wrap gap-2">
          {data.files.map((file) => (
            <Button
              aria-pressed={file.id === (selectedFileId ?? data.files[0]?.id)}
              key={file.id}
              onClick={() => setSelectedFile(file.id)}
              size="sm"
              variant={
                file.id === (selectedFileId ?? data.files[0]?.id)
                  ? 'default'
                  : 'secondary'
              }
            >
              {file.newPath}
            </Button>
          ))}
        </nav>
      )}

      {isPending && (
        <Card role="status">
          <CardContent className="pt-6 text-muted-foreground">
            Загрузка merge request…
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="border-destructive/40" role="alert">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Произошла ошибка'}
            </p>
            <Button
              className="mt-3"
              onClick={handleRetry}
              size="sm"
              variant="secondary"
            >
              Повторить
            </Button>
          </CardContent>
        </Card>
      )}

      {!isPending && !isError && selectedFile && (
        <DiffViewer file={selectedFile} />
      )}

      <div className="mt-8">
        <Button onClick={handleSimulateError} size="sm" variant="secondary">
          Симулировать ошибку
        </Button>
      </div>
    </main>
  )
}

export default MergeRequestPage
