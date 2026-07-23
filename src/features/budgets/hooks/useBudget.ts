import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMonthlyBudget, saveMonthlyBudget } from '../api/budgets'
import type { MonthlyBudget } from '../types'

export const useBudget = (userId: string, month: string, enabled = true) => {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    if (!userId || !enabled) {
      if (!userId) setBudget(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const nextBudget = await fetchMonthlyBudget(userId, month)
      if (requestId === requestIdRef.current) setBudget(nextBudget)
    } catch (reason) {
      if (requestId === requestIdRef.current) {
        setError(reason instanceof Error ? reason.message : 'Không tải được ngân sách.')
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [enabled, month, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = async (amount: number) => {
    if (!userId) throw new Error('Chưa xác định được người dùng.')
    requestIdRef.current += 1
    setLoading(false)
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
