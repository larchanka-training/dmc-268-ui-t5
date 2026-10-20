import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MergeRequestMeta } from './MergeRequestMeta'
import type { MergeRequest } from '@/entities/diff/model/types'

const mergeRequest: MergeRequest = {
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
          id: 'h1',
          oldStart: 10,
          oldLines: 2,
          newStart: 10,
          newLines: 3,
          contextLinesBefore: [],
          lines: [
            { type: 'delete', oldNumber: 11, content: 'old' },
            { type: 'add', newNumber: 11, content: 'new' },
          ],
          contextLinesAfter: [],
          comments: [
            {
              id: 3,
              line: 12,
              side: 'new',
              author: 'GitLab Duo',
              body: 'критично',
              status: 'unresolved',
              isAI: true,
              severity: 'critical',
            },
            {
              id: 4,
              line: 11,
              side: 'new',
              author: 'GitLab Duo',
              body: 'предупреждение',
              status: 'unresolved',
              isAI: true,
              severity: 'warning',
            },
            {
              id: 5,
              line: 11,
              side: 'old',
              author: 'GitLab Duo',
              body: 'инфо',
              status: 'unresolved',
              isAI: true,
              severity: 'info',
            },
            {
              id: 1,
              line: 11,
              side: 'new',
              author: 'Мария',
              body: 'человеческий комментарий не считается',
              status: 'resolved',
            },
          ],
        },
      ],
    },
  ],
}

describe('MergeRequestMeta', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the author and branches', () => {
    render(<MergeRequestMeta mergeRequest={mergeRequest} />)

    expect(
      screen.getByText('Refactor: extract review comment store'),
    ).toBeInTheDocument()
    expect(screen.getByText('автор: Алексей')).toBeInTheDocument()
    expect(screen.getByText('feature/issue-2')).toBeInTheDocument()
    expect(screen.getByText('main')).toBeInTheDocument()
  })

  it('renders review status, verdict and score', () => {
    render(<MergeRequestMeta mergeRequest={mergeRequest} />)

    expect(screen.getByText('Ревью завершено')).toBeInTheDocument()
    expect(screen.getByText('Нужны правки')).toBeInTheDocument()
    expect(screen.getByText('Оценка: 6/10')).toBeInTheDocument()
  })

  it('renders the AI summary', () => {
    render(<MergeRequestMeta mergeRequest={mergeRequest} />)

    expect(screen.getByText('Сводка AI-ревью')).toBeInTheDocument()
    expect(
      screen.getByText('Найдена одна критичная проблема.'),
    ).toBeInTheDocument()
  })

  it('counts only AI comments per severity', () => {
    render(<MergeRequestMeta mergeRequest={mergeRequest} />)

    const counters = screen.getByTestId('severity-counters')
    expect(counters).toHaveTextContent('Критично')
    expect(counters).toHaveTextContent('1')
    expect(counters).toHaveTextContent('Предупреждение')
    expect(counters).toHaveTextContent('Инфо')
  })
})
