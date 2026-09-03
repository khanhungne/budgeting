import { describe, expect, it } from 'vitest'
import type { Transaction } from './types'
import { buildTransactionCalendar, suggestedCalendarDate } from './calendar'

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: crypto.randomUUID(),
  user_id: 'user-1',
  wallet_id: 'wallet-1',
  kind: 'expense',
  amount: 100_000,
  category: 'food',
  note: null,
  occurred_on: '2026-09-01',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  ...overrides,
})

describe('buildTransactionCalendar', () => {
  it('starts weeks on Monday and creates complete calendar rows', () => {
    const cells = buildTransactionCalendar('2026-09', [])

    expect(cells).toHaveLength(35)
    expect(cells[0]).toBeNull()
    expect(cells[1]?.date).toBe('2026-09-01')
    expect(cells[30]?.date).toBe('2026-09-30')
  })

  it('groups income, expenses and category icons by day', () => {
    const cells = buildTransactionCalendar('2026-09', [
      transaction({ amount: 120_000, category: 'food' }),
      transaction({ amount: 80_000, category: 'transport' }),
      transaction({ kind: 'income', amount: 500_000, category: 'salary' }),
      transaction({ occurred_on: '2026-08-31', amount: 999_000 }),
    ])
    const firstDay = cells.find((cell) => cell?.date === '2026-09-01')

    expect(firstDay).toMatchObject({
      transactionCount: 3,
      expenseCount: 2,
      incomeCount: 1,
      expense: 200_000,
      income: 500_000,
      categoryIds: ['food', 'transport', 'salary'],
    })
  })
})

describe('suggestedCalendarDate', () => {
  it('selects today in the current month', () => {
    expect(suggestedCalendarDate('2026-09', [], '2026-09-03')).toBe('2026-09-03')
  })

  it('selects the latest recorded date for another month', () => {
    expect(
      suggestedCalendarDate(
        '2026-08',
        [
          transaction({ occurred_on: '2026-08-11' }),
          transaction({ occurred_on: '2026-08-25' }),
        ],
        '2026-09-03',
      ),
    ).toBe('2026-08-25')
  })
})
