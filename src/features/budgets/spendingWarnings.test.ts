import { describe, expect, it } from 'vitest'
import type { Transaction } from '../transactions/types'
import type { CategoryBudget } from './categoryTypes'
import { getSpendingWarnings } from './spendingWarnings'
import type { MonthlyBudget } from './types'

const transaction = (
  id: string,
  kind: Transaction['kind'],
  amount: number,
  category: string,
): Transaction => ({
  id,
  user_id: 'user',
  wallet_id: null,
  kind,
  amount,
  category,
  note: null,
  occurred_on: '2026-09-03',
  created_at: '2026-09-03T00:00:00.000Z',
  updated_at: '2026-09-03T00:00:00.000Z',
})

const budget = (amount: number): MonthlyBudget => ({
  id: 'monthly',
  user_id: 'user',
  month_start: '2026-09-01',
  amount,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
})

const categoryBudget = (category: string, amount: number): CategoryBudget => ({
  id: category,
  user_id: 'user',
  month_start: '2026-09-01',
  category,
  amount,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
})

describe('spending warnings', () => {
  it('does not create a warning when no limit was set', () => {
    expect(
      getSpendingWarnings(null, [], [transaction('1', 'expense', 2_000_000, 'food')]),
    ).toEqual([])
  })

  it('warns for both the monthly and matching category overages', () => {
    const warnings = getSpendingWarnings(
      budget(1_000_000),
      [categoryBudget('food', 500_000), categoryBudget('shopping', 1_000_000)],
      [
        transaction('1', 'expense', 650_000, 'food'),
        transaction('2', 'expense', 500_000, 'transport'),
        transaction('3', 'income', 10_000_000, 'salary'),
      ],
    )

    expect(warnings).toEqual([
      { scope: 'month', overBy: 150_000 },
      { scope: 'category', category: 'food', overBy: 150_000 },
    ])
  })

  it('does not warn when spending equals the limit', () => {
    expect(
      getSpendingWarnings(
        budget(500_000),
        [categoryBudget('food', 500_000)],
        [transaction('1', 'expense', 500_000, 'food')],
      ),
    ).toEqual([])
  })
})
