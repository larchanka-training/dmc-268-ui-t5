import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DiffSuggestion } from './DiffSuggestion'

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

describe('DiffSuggestion', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders current and proposed lines as a mini diff', () => {
    render(
      <DiffSuggestion
        lang="typescript"
        lineContent="  selectedFileId: string | null"
        suggestion="  selectedFileId: string | undefined"
      />,
    )

    const suggestion = screen.getByTestId('diff-suggestion')
    expect(suggestion).toBeInTheDocument()
    expect(screen.getByText('Предлагаемое изменение')).toBeInTheDocument()

    const oldRow = suggestion.querySelector('[data-suggestion-side="old"]')
    const newRow = suggestion.querySelector('[data-suggestion-side="new"]')
    expect(oldRow).toHaveTextContent('-')
    expect(oldRow).toHaveTextContent('selectedFileId: string | null')
    expect(newRow).toHaveTextContent('+')
    expect(newRow).toHaveTextContent('selectedFileId: string | undefined')
  })
})
