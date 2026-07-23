import { useCallback, useEffect, useState } from 'react'
import { fetchMonthlyBudget, saveMonthlyBudget } from '../api/budgets'
import type { MonthlyBudget } from '../types'

export const useBudget = (userId: string, month: string) => {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setBudget(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setBudget(await fetchMonthlyBudget(userId, month))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tải được ngân sách.')
    } finally {
      setLoading(false)
    }
  }, [month, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = async (amount: number) => {
    if (!userId) throw new Error('Chưa xác định được người dùng.')
    setSaving(true)
    setError(null)
    try {
      setBudget(await saveMonthlyBudget(userId, month, amount))
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Không lưu được ngân sách.'
      setError(message)
      throw reason
    } finally {
      setSaving(false)
    }
  }

  return { budget, loading, saving, error, save, refresh }
}
