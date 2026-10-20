import type { FileChange } from '../model/types'

export type FileTreeDirNode = {
  type: 'dir'
  name: string
  path: string
  children: FileTreeNode[]
}

export type FileTreeFileNode = {
  type: 'file'
  name: string
  path: string
  file: FileChange
}

export type FileTreeNode = FileTreeDirNode | FileTreeFileNode

/**
 * Строит дерево каталогов из списка изменённых файлов.
 * Каталоги идут перед файлами, внутри каждой группы — алфавитный порядок.
 * Переименованные файлы попадают в дерево по новому пути.
 */
export function buildFileTree(files: FileChange[]): FileTreeNode[] {
  const root: FileTreeNode[] = []

  for (const file of files) {
    const segments = file.newPath.split('/')
    const name = segments.pop() ?? file.newPath
    let children = root
    let prefix = ''

    for (const segment of segments) {
      prefix = prefix ? `${prefix}/${segment}` : segment
      let dir = children.find(
        (node): node is FileTreeDirNode =>
          node.type === 'dir' && node.path === prefix,
      )
      if (!dir) {
        dir = { type: 'dir', name: segment, path: prefix, children: [] }
        children.push(dir)
      }
      children = dir.children
    }

    children.push({ type: 'file', name, path: file.newPath, file })
  }

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    })
    for (const node of nodes) {
      if (node.type === 'dir') sortNodes(node.children)
    }
  }

  sortNodes(root)
  return root
}
