import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Columns2, FolderTree, Moon, Rows3, Sun } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { useTheme } from '@/app/providers/theme-provider/ThemeProvider'
import { getMergeRequest } from '@/entities/diff/api/getMergeRequest'
import { useDiffUiStore } from '@/entities/diff/model/diffUiStore'
import { FileTree } from '@/entities/diff/ui/file-tree/FileTree'
import { MergeRequestMeta } from '@/widgets/merge-request-meta/ui/MergeRequestMeta'
import { DiffViewer } from '@/widgets/diff-viewer/ui/DiffViewer'

export function MergeRequestPage() {
  const selectedFileId = useDiffUiStore((state) => state.selectedFileId)
  const setSelectedFile = useDiffUiStore((state) => state.setSelectedFile)
  const viewMode = useDiffUiStore((state) => state.viewMode)
  const setViewMode = useDiffUiStore((state) => state.setViewMode)
  const simulateErrorRef = useRef(false)
  const fileRefs = useRef(new Map<string, HTMLElement>())
  const [isTreeOpen, setTreeOpen] = useState(false)
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

  useEffect(() => {
    if (!data || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const topmost = visible.reduce((top, entry) =>
          entry.boundingClientRect.top < top.boundingClientRect.top
            ? entry
            : top,
        )
        const fileId = (topmost.target as HTMLElement).dataset.fileId
        if (fileId) setSelectedFile(fileId)
      },
      { rootMargin: '0px 0px -70% 0px' },
    )

    for (const element of fileRefs.current.values()) observer.observe(element)

    return () => observer.disconnect()
  }, [data, setSelectedFile])

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId)
    setTreeOpen(false)
    fileRefs.current.get(fileId)?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleSimulateError = () => {
    simulateErrorRef.current = true
    void refetch()
  }

  const handleRetry = () => {
    simulateErrorRef.current = false
    void refetch()
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-primary">
            DMC-268 Team 5 UI
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Merge request
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Просмотрщик дифа с подсветкой синтаксиса (Shiki),
            inline-комментариями ревьюера и раскрывающимся контекстом.
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
        <div className="mb-6">
          <MergeRequestMeta mergeRequest={data} />
        </div>
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

      {data && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="lg:hidden">
            <Button
              aria-expanded={isTreeOpen}
              onClick={() => setTreeOpen((open) => !open)}
              size="sm"
              variant="secondary"
            >
              <FolderTree aria-hidden="true" size={14} />
              {`Файлы (${data.files.length})`}
            </Button>
            {isTreeOpen && (
              <nav
                aria-label="Изменённые файлы"
                className="mt-3 max-h-96 overflow-y-auto rounded-lg border p-3"
              >
                <FileTree
                  activeFileId={selectedFileId ?? data.files[0]?.id ?? null}
                  files={data.files}
                  onFileSelect={handleFileSelect}
                />
              </nav>
            )}
          </div>

          <aside className="hidden w-72 shrink-0 lg:block">
            <nav
              aria-label="Изменённые файлы"
              className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-lg border p-3"
            >
              <FileTree
                activeFileId={selectedFileId ?? data.files[0]?.id ?? null}
                files={data.files}
                onFileSelect={handleFileSelect}
              />
            </nav>
          </aside>

          <section className="min-w-0 flex-1 space-y-4">
            <div className="flex justify-end">
              <div
                aria-label="Режим отображения диффа"
                className="flex gap-1 rounded-lg border p-1"
                role="group"
              >
                <Button
                  aria-pressed={viewMode === 'unified'}
                  onClick={() => setViewMode('unified')}
                  size="sm"
                  variant={viewMode === 'unified' ? 'default' : 'ghost'}
                >
                  <Rows3 aria-hidden="true" size={14} />
                  Unified
                </Button>
                <Button
                  aria-pressed={viewMode === 'split'}
                  onClick={() => setViewMode('split')}
                  size="sm"
                  variant={viewMode === 'split' ? 'default' : 'ghost'}
                >
                  <Columns2 aria-hidden="true" size={14} />
                  Side-by-side
                </Button>
              </div>
            </div>

            {data.files.map((file) => (
              <div
                className="scroll-mt-6"
                data-file-id={file.id}
                key={file.id}
                ref={(node) => {
                  if (node) fileRefs.current.set(file.id, node)
                  else fileRefs.current.delete(file.id)
                }}
              >
                <DiffViewer file={file} />
              </div>
            ))}
          </section>
        </div>
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
