import { describe, expect, it } from 'vitest'
import type { Transaction } from '../types'
import { aggregateMonthlyTrends } from './useTransactionTrends'

const makeTransaction = (
  id: string,
  kind: Transaction['kind'],
  amount: number,
  occurredOn: string,
): Transaction => ({
  id,
  user_id: 'user',
  wallet_id: null,
  kind,
  amount,
  category: kind === 'income' ? 'salary' : 'food',
  note: null,
  occurred_on: occurredOn,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
})

describe('monthly trend aggregation', () => {
  it('keeps empty months and computes balances', () => {
    const trends = aggregateMonthlyTrends(
      [
        makeTransaction('1', 'income', 10_000_000, '2026-05-01'),
        makeTransaction('2', 'expense', 2_000_000, '2026-05-02'),
        makeTransaction('3', 'expense', 500_000, '2026-07-02'),
      ],
      '2026-07',
      3,
    )

    expect(trends.map((item) => item.month)).toEqual(['2026-05', '2026-06', '2026-07'])
    expect(trends[0].balance).toBe(8_000_000)
    expect(trends[1]).toMatchObject({ income: 0, expense: 0, balance: 0 })
    expect(trends[2].balance).toBe(-500_000)
  })
})
