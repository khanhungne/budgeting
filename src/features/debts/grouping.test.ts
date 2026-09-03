import { describe, expect, it } from 'vitest'
import type { Debt } from './types'
import { summarizePeopleIOwe } from './grouping'

const debt = (overrides: Partial<Debt>): Debt => ({
  id: crypto.randomUUID(),
  user_id: 'user-1',
  person: 'An',
  amount: 100_000,
  direction: 'i_owe',
  status: 'pending',
  occurred_on: '2026-09-01',
  due_on: null,
  paid_on: null,
  note: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  ...overrides,
})

describe('summarizePeopleIOwe', () => {
  it('groups names without case sensitivity and totals pending debts only', () => {
    const result = summarizePeopleIOwe(
      [
        debt({ person: 'An', amount: 100_000 }),
        debt({ person: ' an ', amount: 250_000, due_on: '2026-09-02' }),
        debt({ person: 'Bình', amount: 500_000, direction: 'owed_to_me' }),
        debt({ person: 'An', amount: 900_000, status: 'paid' }),
      ],
      '2026-09-03',
    )

    expect(result).toEqual([
      {
        person: 'An',
        total: 350_000,
        count: 2,
        overdueCount: 1,
        nearestDue: '2026-09-02',
      },
    ])
  })

  it('puts overdue people first, then sorts by nearest due date', () => {
    const result = summarizePeopleIOwe(
      [
        debt({ person: 'Châu', due_on: '2026-09-08' }),
        debt({ person: 'Bình', due_on: '2026-09-05' }),
        debt({ person: 'An', due_on: '2026-09-01' }),
      ],
      '2026-09-03',
    )

    expect(result.map((item) => item.person)).toEqual(['An', 'Bình', 'Châu'])
  })
})
