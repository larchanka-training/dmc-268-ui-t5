import { describe, expect, it } from 'vitest'
import { useDiffUiStore } from './diffUiStore'

describe('useDiffUiStore', () => {
  it('starts with no expanded hunks and no selected file', () => {
    useDiffUiStore.setState({ expandedHunks: {}, selectedFileId: null })

    expect(useDiffUiStore.getState().expandedHunks).toEqual({})
    expect(useDiffUiStore.getState().selectedFileId).toBeNull()
  })

  it('toggles a hunk expansion state', () => {
    useDiffUiStore.setState({ expandedHunks: {}, selectedFileId: null })

    useDiffUiStore.getState().toggleHunk('h1')
    expect(useDiffUiStore.getState().expandedHunks.h1).toBe(true)

    useDiffUiStore.getState().toggleHunk('h1')
    expect(useDiffUiStore.getState().expandedHunks.h1).toBe(false)
  })

  it('sets the selected file', () => {
    useDiffUiStore.setState({ expandedHunks: {}, selectedFileId: null })

    useDiffUiStore.getState().setSelectedFile('file-1')
    expect(useDiffUiStore.getState().selectedFileId).toBe('file-1')
  })

  it('starts in unified view mode', () => {
    useDiffUiStore.setState({ viewMode: 'unified' })

    expect(useDiffUiStore.getState().viewMode).toBe('unified')
  })

  it('switches the view mode', () => {
    useDiffUiStore.setState({ viewMode: 'unified' })

    useDiffUiStore.getState().setViewMode('split')
    expect(useDiffUiStore.getState().viewMode).toBe('split')

    useDiffUiStore.getState().setViewMode('unified')
    expect(useDiffUiStore.getState().viewMode).toBe('unified')
  })
})
