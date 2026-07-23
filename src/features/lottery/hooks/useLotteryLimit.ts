import { useCallback, useEffect, useState } from 'react'
import { fetchLotteryMonthlyLimit, saveLotteryMonthlyLimit } from '../api/limits'
import type { LotteryMonthlyLimit } from '../limitTypes'

export const useLotteryLimit = (userId: string, month: string) => {
  const [limit, setLimit] = useState<LotteryMonthlyLimit | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setLimit(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setLimit(await fetchLotteryMonthlyLimit(userId, month))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tải được hạn mức.')
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
      setLimit(await saveLotteryMonthlyLimit(userId, month, amount))
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Không lưu được hạn mức.'
      setError(message)
      throw reason
    } finally {
      setSaving(false)
    }
  }

  return { limit, loading, saving, error, save, refresh }
}
