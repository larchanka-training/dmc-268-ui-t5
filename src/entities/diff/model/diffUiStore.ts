import { create } from 'zustand'

type DiffUiState = {
  expandedHunks: Record<string, boolean>
  selectedFileId: string | null
  toggleHunk: (hunkId: string) => void
  setSelectedFile: (fileId: string) => void
}

export const useDiffUiStore = create<DiffUiState>()((set) => ({
  expandedHunks: {},
  selectedFileId: null,
  toggleHunk: (hunkId) =>
    set((state) => ({
      expandedHunks: {
        ...state.expandedHunks,
        [hunkId]: !state.expandedHunks[hunkId],
      },
    })),
  setSelectedFile: (fileId) => set({ selectedFileId: fileId }),
}))
