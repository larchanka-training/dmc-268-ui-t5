import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Code } from './Code'

vi.mock('@/shared/lib/shiki/useShiki', () => ({
  useShiki: vi.fn(() => ({
    highlighter: {
      codeToTokensBase: (code: string) =>
        code.split('\n').map((line) => [
          { content: line, color: line.includes('const') ? '#569cd6' : undefined },
        ]),
    },
    ready: true,
    shikiTheme: 'github-light',
  })),
}))

describe('Code', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders each line with a line number', () => {
    render(<Code code={'const a = 1\nconst b = 2'} lang="typescript" />)

    expect(screen.getByTestId('code-block')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('const a = 1')).toBeInTheDocument()
    expect(screen.getByText('const b = 2')).toBeInTheDocument()
  })

  it('hides line numbers when showLineNumbers is false', () => {
    render(<Code code={'const a = 1'} lang="typescript" showLineNumbers={false} />)

    expect(screen.queryByText('1')).not.toBeInTheDocument()
    expect(screen.getByText('const a = 1')).toBeInTheDocument()
  })
})
