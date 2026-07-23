import { useCallback, useEffect, useMemo, useState } from 'react'
import { shiftMonth } from '../../../lib/dates'
import { fetchTransactionsRange } from '../api/transactions'
import type { Transaction } from '../types'

export type TrendMonths = 3 | 6 | 12

export type MonthlyTrend = {
  month: string
  income: number
  expense: number
  balance: number
}

export const aggregateMonthlyTrends = (
  transactions: Transaction[],
  endMonth: string,
  months: TrendMonths,
): MonthlyTrend[] =>
  Array.from({ length: months }, (_, index) => shiftMonth(endMonth, index - months + 1)).map(
    (month) => {
      const totals = transactions
        .filter((transaction) => transaction.occurred_on.startsWith(month))
        .reduce(
          (result, transaction) => {
            result[transaction.kind] += Number(transaction.amount)
            return result
          },
          { income: 0, expense: 0 },
        )

      return {
        month,
        ...totals,
        balance: totals.income - totals.expense,
      }
    },
  )

export const useTransactionTrends = (
  userId: string,
  endMonth: string,
  months: TrendMonths,
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setTransactions(await fetchTransactionsRange(shiftMonth(endMonth, 1 - months), endMonth))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tải được xu hướng nhiều tháng.')
    } finally {
      setLoading(false)
    }
  }, [endMonth, months, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const trends = useMemo(
    () => aggregateMonthlyTrends(transactions, endMonth, months),
    [endMonth, months, transactions],
  )

  return { trends, loading, error, refresh }
}
