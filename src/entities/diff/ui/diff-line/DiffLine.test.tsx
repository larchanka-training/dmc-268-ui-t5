import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiffLine } from './DiffLine'
import type { DiffLine as DiffLineType } from '../../model/types'

vi.mock('@/shared/lib/shiki/useShiki', () => ({
  useShiki: vi.fn(() => ({
    highlighter: {
      codeToTokensBase: (code: string) => [[{ content: code, color: '#fff' }]],
    },
    ready: true,
    shikiTheme: 'github-light',
  })),
}))

describe('DiffLine', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders an added line with a plus sign and new number', () => {
    const line: DiffLineType = {
      type: 'add',
      newNumber: 11,
      content: 'const a = 1',
    }

    render(<DiffLine line={line} lang="typescript" />)

    const row = screen.getByTestId('diff-line')
    expect(row).toHaveAttribute('data-line-type', 'add')
    expect(row).toHaveTextContent('+')
    expect(row).toHaveTextContent('11')
    expect(row).toHaveTextContent('const a = 1')
  })

  it('renders a deleted line with a minus sign and old number', () => {
    const line: DiffLineType = {
      type: 'delete',
      oldNumber: 11,
      content: 'const a = 1',
    }

    render(<DiffLine line={line} lang="typescript" />)

    const row = screen.getByTestId('diff-line')
    expect(row).toHaveAttribute('data-line-type', 'delete')
    expect(row).toHaveTextContent('-')
    expect(row).toHaveTextContent('11')
  })

  it('renders a context line with both line numbers', () => {
    const line: DiffLineType = {
      type: 'context',
      oldNumber: 10,
      newNumber: 10,
      content: '  filter: Filter',
    }

    render(<DiffLine line={line} lang="typescript" />)

    const row = screen.getByTestId('diff-line')
    expect(row).toHaveAttribute('data-line-type', 'context')
    expect(row).toHaveTextContent('10')
  })
})
