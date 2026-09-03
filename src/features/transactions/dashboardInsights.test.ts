import { describe, expect, it } from 'vitest'
import type { Transaction } from './types'
import { getDashboardInsights } from './dashboardInsights'

const transaction = (
  id: string,
  kind: Transaction['kind'],
  amount: number,
  occurredOn: string,
  category = 'food',
): Transaction => ({
  id,
  user_id: 'user',
  wallet_id: null,
  kind,
  amount,
  category,
  note: null,
  occurred_on: occurredOn,
  created_at: `${occurredOn}T00:00:00.000Z`,
  updated_at: `${occurredOn}T00:00:00.000Z`,
})

describe('dashboard insights', () => {
  it('builds a seven-day spending pulse ending today', () => {
    const insights = getDashboardInsights(
      [
        transaction('1', 'income', 10_000_000, '2026-09-01', 'salary'),
        transaction('2', 'expense', 200_000, '2026-09-07'),
        transaction('3', 'expense', 300_000, '2026-09-09'),
      ],
      '2026-09',
      new Date(2026, 8, 9, 20),
    )

    expect(insights.dailySpending).toHaveLength(7)
    expect(insights.dailySpending[0].date).toBe('2026-09-03')
    expect(insights.dailySpending.at(-1)).toMatchObject({
      date: '2026-09-09',
      amount: 300_000,
      isFocus: true,
    })
    expect(insights.focusExpense).toBe(300_000)
    expect(insights.savingsRate).toBe(95)
  })

  it('uses the final day for a past month and finds the largest category', () => {
    const insights = getDashboardInsights(
      [
        transaction('1', 'expense', 400_000, '2026-08-12', 'food'),
        transaction('2', 'expense', 600_000, '2026-08-29', 'shopping'),
        transaction('3', 'expense', 500_000, '2026-08-30', 'shopping'),
      ],
      '2026-08',
      new Date(2026, 8, 9),
    )

    expect(insights.dailySpending.at(-1)?.date).toBe('2026-08-31')
    expect(insights.focusLabel).toBe('Ngày 31/8')
    expect(insights.topCategory).toMatchObject({
      id: 'shopping',
      amount: 1_100_000,
    })
    expect(Math.round(insights.topCategory?.share ?? 0)).toBe(73)
  })

  it('keeps early current months compact and safe without income', () => {
    const insights = getDashboardInsights([], '2026-09', new Date(2026, 8, 3))

    expect(insights.dailySpending).toHaveLength(3)
    expect(insights.averageExpense).toBe(0)
    expect(insights.maxDailySpending).toBe(1)
    expect(insights.savingsRate).toBeNull()
    expect(insights.topCategory).toBeNull()
  })
})
