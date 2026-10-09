import { describe, expect, it } from 'vitest'
import { useReviewCommentsStore } from './reviewCommentsStore'

describe('useReviewCommentsStore', () => {
  it('starts with the all filter', () => {
    useReviewCommentsStore.setState({ filter: 'all' })

    expect(useReviewCommentsStore.getState().filter).toBe('all')
  })

  it('updates the selected filter', () => {
    useReviewCommentsStore.getState().setFilter('unresolved')

    expect(useReviewCommentsStore.getState().filter).toBe('unresolved')
  })
})
