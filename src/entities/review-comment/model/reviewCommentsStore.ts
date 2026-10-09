import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ReviewCommentFilter = 'all' | 'unresolved' | 'resolved'

type ReviewCommentsState = {
  filter: ReviewCommentFilter
  setFilter: (filter: ReviewCommentFilter) => void
}

export const useReviewCommentsStore = create<ReviewCommentsState>()(
  persist(
    (set) => ({
      filter: 'all',
      setFilter: (filter) => set({ filter }),
    }),
    {
      name: 'dmc-268-review-comments',
    },
  ),
)
