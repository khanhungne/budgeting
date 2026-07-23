import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createTransaction,
  fetchTransactions,
  removeTransaction,
  updateTransaction,
} from '../api/transactions'
import type { Transaction, TransactionInput } from '../types'

export const useTransactions = (userId: string, month: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    if (!userId) {
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchTransactions(userId, month)
      if (requestId === requestIdRef.current) setTransactions(rows)
    } catch (reason) {
      if (requestId === requestIdRef.current) {
        setError(reason instanceof Error ? reason.message : 'Không tải được giao dịch.')
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [month, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = async (input: TransactionInput, editingId?: string) => {
    if (!userId) throw new Error('Chưa xác định được người dùng.')
    requestIdRef.current += 1
    setLoading(false)
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        const updated = await updateTransaction(editingId, input)
        setTransactions((current) => {
          if (!updated.occurred_on.startsWith(month)) {
            return current.filter((transaction) => transaction.id !== editingId)
          }
          return current
            .map((transaction) => (transaction.id === editingId ? updated : transaction))
            .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))
        })
      } else {
        const created = await createTransaction(userId, input)
        if (created.occurred_on.startsWith(month)) {
          setTransactions((current) =>
            [created, ...current].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)),
          )
        }
      }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Không lưu được giao dịch.'
      setError(message)
      throw reason
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    requestIdRef.current += 1
    setLoading(false)
    setSaving(true)
    setError(null)
    try {
      await removeTransaction(id)
      setTransactions((current) => current.filter((transaction) => transaction.id !== id))
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Không xoá được giao dịch.'
      setError(message)
      throw reason
    } finally {
      setSaving(false)
    }
  }

  const totals = useMemo(
    () =>
      transactions.reduce(
        (result, transaction) => {
          result[transaction.kind] += Number(transaction.amount)
          return result
        },
        { income: 0, expense: 0 },
      ),
    [transactions],
  )

  return {
    transactions,
    loading,
    saving,
    error,
    totals: { ...totals, balance: totals.income - totals.expense },
    refresh,
    save,
    remove,
  }
}
