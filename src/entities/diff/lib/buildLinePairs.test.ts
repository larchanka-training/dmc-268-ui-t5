import { describe, expect, it } from 'vitest'
import { buildLinePairs } from './buildLinePairs'
import type { DiffLine } from '../model/types'

function line(
  partial: Partial<DiffLine> & { type: DiffLine['type'] },
): DiffLine {
  return partial as DiffLine
}

describe('buildLinePairs', () => {
  it('pairs deletes with following adds', () => {
    const pairs = buildLinePairs([
      line({ type: 'context', oldNumber: 10, newNumber: 10, content: 'ctx' }),
      line({ type: 'delete', oldNumber: 11, content: 'old' }),
      line({ type: 'add', newNumber: 11, content: 'new1' }),
      line({ type: 'add', newNumber: 12, content: 'new2' }),
    ])

    expect(pairs).toEqual([
      {
        old: expect.objectContaining({ content: 'ctx' }),
        new: expect.objectContaining({ content: 'ctx' }),
      },
      {
        old: expect.objectContaining({ content: 'old' }),
        new: expect.objectContaining({ content: 'new1' }),
      },
      { new: expect.objectContaining({ content: 'new2' }) },
    ])
  })

  it('flushes trailing deletes without a new counterpart', () => {
    const pairs = buildLinePairs([
      line({ type: 'delete', oldNumber: 11, content: 'old1' }),
      line({ type: 'delete', oldNumber: 12, content: 'old2' }),
    ])

    expect(pairs).toEqual([
      { old: expect.objectContaining({ content: 'old1' }) },
      { old: expect.objectContaining({ content: 'old2' }) },
    ])
  })

  it('flushes pending deletes before a context line', () => {
    const pairs = buildLinePairs([
      line({ type: 'delete', oldNumber: 11, content: 'old' }),
      line({ type: 'context', oldNumber: 12, newNumber: 13, content: 'ctx' }),
    ])

    expect(pairs).toEqual([
      { old: expect.objectContaining({ content: 'old' }) },
      {
        old: expect.objectContaining({ content: 'ctx' }),
        new: expect.objectContaining({ content: 'ctx' }),
      },
    ])
  })
})
