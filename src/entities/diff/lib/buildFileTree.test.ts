import { describe, expect, it } from 'vitest'
import { buildFileTree } from './buildFileTree'
import type { FileChange } from '../model/types'

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

describe('buildFileTree', () => {
  it('returns an empty tree for no files', () => {
    expect(buildFileTree([])).toEqual([])
  })

  it('nests files under their directories', () => {
    const tree = buildFileTree([
      file({ id: '1', newPath: 'src/store.ts' }),
      file({ id: '2', newPath: 'src/shared/lib/utils.ts' }),
    ])

    expect(tree).toHaveLength(1)
    const src = tree[0]
    expect(src).toMatchObject({ type: 'dir', name: 'src' })

    const shared = src.type === 'dir' ? src.children.find((node) => node.name === 'shared') : undefined
    const lib = shared?.type === 'dir' ? shared.children[0] : undefined
    expect(lib).toMatchObject({ type: 'dir', name: 'lib' })
    expect(lib?.type === 'dir' ? lib.children[0] : undefined).toMatchObject({
      type: 'file',
      name: 'utils.ts',
      file: expect.objectContaining({ id: '2' }),
    })
    expect(src.type === 'dir' ? src.children.map((node) => node.name) : []).toEqual(
      expect.arrayContaining(['store.ts', 'shared']),
    )
  })

  it('sorts directories before files, alphabetically', () => {
    const tree = buildFileTree([
      file({ id: '1', newPath: 'zebra.ts' }),
      file({ id: '2', newPath: 'vite.config.ts' }),
      file({ id: '3', newPath: 'docs/architecture.md' }),
      file({ id: '4', newPath: 'package.json' }),
    ])

    expect(tree.map((node) => node.name)).toEqual([
      'docs',
      'package.json',
      'vite.config.ts',
      'zebra.ts',
    ])
  })

  it('places renamed files under the new path', () => {
    const tree = buildFileTree([
      file({
        id: '1',
        oldPath: 'src/utils.ts',
        newPath: 'src/shared/lib/utils.ts',
        status: 'renamed',
      }),
    ])

    const utils =
      tree[0]?.type === 'dir'
        ? tree[0].children[0]?.type === 'dir'
          ? tree[0].children[0].children[0]?.type === 'dir'
            ? tree[0].children[0].children[0].children[0]
            : undefined
          : undefined
        : undefined

    expect(utils).toMatchObject({ type: 'file', name: 'utils.ts' })
  })

  it('keeps every file reachable with its FileChange payload', () => {
    const files = [
      file({ id: '1', newPath: 'a.ts' }),
      file({ id: '2', newPath: 'src/b.ts' }),
      file({ id: '3', newPath: 'src/nested/deep/c.ts' }),
    ]

    const tree = buildFileTree(files)
    const seen: string[] = []

    const walk = (nodes: typeof tree) => {
      for (const node of nodes) {
        if (node.type === 'file') seen.push(node.file.id)
        else walk(node.children)
      }
    }
    walk(tree)

    expect(seen.sort()).toEqual(['1', '2', '3'])
  })
})
