import { create } from 'zustand'
import type { DiffViewMode } from './types'

type DiffUiState = {
  expandedHunks: Record<string, boolean>
  selectedFileId: string | null
  viewMode: DiffViewMode
  toggleHunk: (hunkId: string) => void
  setSelectedFile: (fileId: string) => void
  setViewMode: (viewMode: DiffViewMode) => void
}

export const useDiffUiStore = create<DiffUiState>()((set) => ({
  expandedHunks: {},
  selectedFileId: null,
  viewMode: 'unified',
  toggleHunk: (hunkId) =>
    set((state) => ({
      expandedHunks: {
        ...state.expandedHunks,
        [hunkId]: !state.expandedHunks[hunkId],
      },
    })),
  setSelectedFile: (fileId) => set({ selectedFileId: fileId }),
  setViewMode: (viewMode) => set({ viewMode }),
}))
