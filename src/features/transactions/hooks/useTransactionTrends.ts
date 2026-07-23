import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { shiftMonth } from '../../../lib/dates'
import {
  fetchTransactionsRange,
  type TransactionTrendRow,
} from '../api/transactions'
import type { Transaction } from '../types'

export type TrendMonths = 3 | 6 | 12

export type MonthlyTrend = {
  month: string
  income: number
  expense: number
  balance: number
}

export const aggregateMonthlyTrends = (
  transactions: TransactionTrendRow[],
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
  currentTransactions: Transaction[],
  enabled = true,
) => {
  const [historicalTransactions, setHistoricalTransactions] = useState<
    TransactionTrendRow[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    if (!userId || !enabled) {
      if (!userId) setHistoricalTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchTransactionsRange(
        userId,
        shiftMonth(endMonth, 1 - months),
        shiftMonth(endMonth, -1),
      )
      if (requestId === requestIdRef.current) setHistoricalTransactions(rows)
    } catch (reason) {
      if (requestId === requestIdRef.current) {
        setError(
          reason instanceof Error ? reason.message : 'Không tải được xu hướng nhiều tháng.',
        )
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [enabled, endMonth, months, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const trends = useMemo(
    () =>
      aggregateMonthlyTrends(
        [
          ...historicalTransactions,
          ...currentTransactions.map(({ kind, amount, occurred_on }) => ({
            kind,
            amount,
            occurred_on,
          })),
        ],
        endMonth,
        months,
      ),
    [currentTransactions, endMonth, historicalTransactions, months],
  )

  return { trends, loading, error, refresh }
}
