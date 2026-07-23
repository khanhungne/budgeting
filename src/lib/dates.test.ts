import { describe, expect, it } from 'vitest'
import { getMonthBounds, shiftMonth } from './dates'

describe('date helpers', () => {
  it('moves correctly across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })

  it('returns an exclusive next-month boundary', () => {
    expect(getMonthBounds('2026-12')).toEqual({
      start: '2026-12-01',
      nextMonth: '2027-01-01',
    })
  })
})
