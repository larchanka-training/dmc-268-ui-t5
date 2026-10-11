import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FileTree } from './FileTree'
import type { FileChange } from '../../model/types'

function file(
  partial: Partial<FileChange> & { id: string; newPath: string },
): FileChange {
  return {
    oldPath: partial.newPath,
    language: 'typescript',
    hunks: [],
    ...partial,
  }
}

const files: FileChange[] = [
  file({ id: 'f-root', newPath: 'README.md' }),
  file({ id: 'f-nested', newPath: 'src/lib/utils.ts' }),
  file({
    id: 'f-renamed',
    oldPath: 'src/old.ts',
    newPath: 'src/lib/new.ts',
    status: 'renamed',
  }),
]

function setup(activeFileId: string | null = null) {
  const onFileSelect = vi.fn()

  const view = render(
    <FileTree
      activeFileId={activeFileId}
      files={files}
      onFileSelect={onFileSelect}
    />,
  )

  return { onFileSelect, view }
}

describe('FileTree', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders directories expanded by default', () => {
    setup()

    const src = screen.getByRole('button', { name: 'src' })
    const lib = screen.getByRole('button', { name: 'lib' })

    expect(src).toHaveAttribute('aria-expanded', 'true')
    expect(lib).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'utils.ts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'new.ts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'README.md' })).toBeInTheDocument()
  })

  it('places renamed files under the new path', () => {
    setup()

    expect(screen.getByRole('button', { name: 'new.ts' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'old.ts' })).not.toBeInTheDocument()
    expect(screen.getByTestId('file-tree-status-renamed')).toBeInTheDocument()
  })

  it('collapses and expands a directory', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'src' }))

    expect(screen.getByRole('button', { name: 'src' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(
      screen.queryByRole('button', { name: 'utils.ts' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'src' }))

    expect(screen.getByRole('button', { name: 'utils.ts' })).toBeInTheDocument()
  })

  it('calls onFileSelect with the file id', () => {
    const { onFileSelect } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'utils.ts' }))

    expect(onFileSelect).toHaveBeenCalledWith('f-nested')
  })

  it('highlights the active file', () => {
    setup('f-nested')

    expect(screen.getByRole('button', { name: 'utils.ts' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    expect(screen.getByRole('button', { name: 'new.ts' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('auto-expands ancestors of the active file', () => {
    const { view } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'src' }))
    expect(
      screen.queryByRole('button', { name: 'new.ts' }),
    ).not.toBeInTheDocument()

    view.rerender(
      <FileTree activeFileId="f-renamed" files={files} onFileSelect={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: 'new.ts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'src' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('shows added and deleted line counts', () => {
    const withCounts: FileChange[] = [
      {
        id: 'f-counts',
        oldPath: 'a.ts',
        newPath: 'a.ts',
        language: 'typescript',
        hunks: [
          {
            id: 'h1',
            oldStart: 1,
            oldLines: 1,
            newStart: 1,
            newLines: 2,
            lines: [
              { type: 'context', oldNumber: 1, newNumber: 1, content: 'ctx' },
              { type: 'add', newNumber: 2, content: 'added' },
              { type: 'delete', oldNumber: 2, content: 'removed' },
            ],
            comments: [],
            contextLinesBefore: [],
            contextLinesAfter: [],
          },
        ],
      },
    ]

    render(
      <FileTree activeFileId={null} files={withCounts} onFileSelect={vi.fn()} />,
    )

    const row = screen.getByRole('button', { name: 'a.ts' }).closest('li')

    expect(row).toHaveTextContent('+1')
    expect(row).toHaveTextContent('-1')
  })
})
