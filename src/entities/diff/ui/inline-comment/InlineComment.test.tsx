import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InlineComment } from './InlineComment'
import type { InlineComment as InlineCommentType } from '../../model/types'

vi.mock('@/shared/lib/shiki/useShiki', () => ({
  useShiki: vi.fn(() => ({
    highlighter: {
      codeToTokensBase: (code: string) => [
        [{ content: code, color: undefined }],
      ],
    },
    ready: true,
    shikiTheme: 'github-light',
  })),
}))

const aiComment: InlineCommentType = {
  id: 3,
  line: 12,
  side: 'new',
  author: 'GitLab Duo',
  body: 'Обращение к localStorage без try/catch.',
  status: 'unresolved',
  isAI: true,
  severity: 'critical',
  suggestion: '  selectedFileId: string | undefined',
}

const humanComment: InlineCommentType = {
  id: 1,
  line: 11,
  side: 'new',
  author: 'Мария',
  body: 'комментарий ревьюера',
  status: 'resolved',
}

describe('InlineComment', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders an AI comment with severity badge and AI mark', () => {
    render(
      <InlineComment
        comment={aiComment}
        lang="typescript"
        lineContent="  selectedFileId: string | null"
      />,
    )

    expect(screen.getByText('GitLab Duo')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByTestId('severity-badge-critical')).toBeInTheDocument()
    expect(screen.getByText(aiComment.body)).toBeInTheDocument()
  })

  it('renders the suggestion mini diff when line content is known', () => {
    render(
      <InlineComment
        comment={aiComment}
        lang="typescript"
        lineContent="  selectedFileId: string | null"
      />,
    )

    const suggestion = screen.getByTestId('diff-suggestion')
    const oldRow = suggestion.querySelector('[data-suggestion-side="old"]')
    const newRow = suggestion.querySelector('[data-suggestion-side="new"]')
    expect(oldRow).toHaveTextContent('selectedFileId: string | null')
    expect(newRow).toHaveTextContent('selectedFileId: string | undefined')
  })

  it('hides the suggestion block when line content is unknown', () => {
    render(<InlineComment comment={aiComment} lang="typescript" />)

    expect(screen.queryByTestId('diff-suggestion')).not.toBeInTheDocument()
  })

  it('shows the body expanded by default and collapses on toggle', () => {
    render(
      <InlineComment
        comment={aiComment}
        lang="typescript"
        lineContent="  selectedFileId: string | null"
      />,
    )

    expect(screen.getByTestId('inline-comment-body')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('inline-comment-toggle'))

    expect(screen.queryByTestId('inline-comment-body')).not.toBeInTheDocument()
    expect(screen.getByTestId('severity-badge-critical')).toBeInTheDocument()
  })

  it('collapses and expands back', () => {
    render(<InlineComment comment={aiComment} lang="typescript" />)

    fireEvent.click(screen.getByTestId('inline-comment-toggle'))
    fireEvent.click(screen.getByTestId('inline-comment-toggle'))

    expect(screen.getByTestId('inline-comment-body')).toBeInTheDocument()
  })

  it('renders a human comment without severity badge', () => {
    render(<InlineComment comment={humanComment} lang="typescript" />)

    expect(screen.getByText('Мария')).toBeInTheDocument()
    expect(screen.queryByTestId(/severity-badge-/)).not.toBeInTheDocument()
    expect(screen.queryByText('AI')).not.toBeInTheDocument()
  })
})
