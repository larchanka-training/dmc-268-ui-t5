import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiffHunk } from './DiffHunk'
import type { Hunk } from '../../model/types'
import { useDiffUiStore } from '../../model/diffUiStore'

vi.mock('@/shared/lib/shiki/useShiki', () => ({
  useShiki: vi.fn(() => ({
    highlighter: {
      codeToTokensBase: (code: string) => [[{ content: code, color: undefined }]],
    },
    ready: true,
    shikiTheme: 'github-light',
  })),
}))

const hunk: Hunk = {
  id: 'h1',
  oldStart: 10,
  oldLines: 2,
  newStart: 10,
  newLines: 3,
  contextLinesBefore: [
    { type: 'context', oldNumber: 8, newNumber: 8, content: 'before' },
  ],
  lines: [
    { type: 'context', oldNumber: 10, newNumber: 10, content: 'ctx' },
    { type: 'add', newNumber: 11, content: 'added' },
  ],
  contextLinesAfter: [
    { type: 'context', oldNumber: 13, newNumber: 14, content: 'after' },
  ],
  comments: [
    {
      id: 1,
      line: 11,
      side: 'new',
      author: 'Мария',
      body: 'комментарий',
      status: 'resolved',
    },
  ],
}

describe('DiffHunk', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    useDiffUiStore.setState({ expandedHunks: {}, selectedFileId: null })
  })

  it('renders the hunk header and lines', () => {
    render(<DiffHunk hunk={hunk} lang="typescript" />)

    expect(screen.getByTestId('diff-hunk')).toBeInTheDocument()
    expect(screen.getByText('@@ -10,2 +10,3 @@')).toBeInTheDocument()
    expect(screen.getByText('added')).toBeInTheDocument()
  })

  it('hides context lines until expanded', () => {
    render(<DiffHunk hunk={hunk} lang="typescript" />)

    expect(screen.queryByText('before')).not.toBeInTheDocument()
    expect(screen.queryByText('after')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Раскрыть контекст' })[0])
  })

  it('reveals context lines after toggling', () => {
    render(<DiffHunk hunk={hunk} lang="typescript" />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Раскрыть контекст' })[0])

    expect(screen.getByText('before')).toBeInTheDocument()
    expect(screen.getByText('after')).toBeInTheDocument()
  })

  it('renders inline comments anchored to matching lines', () => {
    render(<DiffHunk hunk={hunk} lang="typescript" />)

    expect(screen.getByTestId('inline-comment')).toBeInTheDocument()
    expect(screen.getByText('Мария')).toBeInTheDocument()
    expect(screen.getByText('комментарий')).toBeInTheDocument()
  })
})
