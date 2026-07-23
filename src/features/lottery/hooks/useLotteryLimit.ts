import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLotteryMonthlyLimit, saveLotteryMonthlyLimit } from '../api/limits'
import type { LotteryMonthlyLimit } from '../limitTypes'

export const useLotteryLimit = (userId: string, month: string, enabled = true) => {
  const [limit, setLimit] = useState<LotteryMonthlyLimit | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    if (!userId || !enabled) {
      if (!userId) setLimit(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const nextLimit = await fetchLotteryMonthlyLimit(userId, month)
      if (requestId === requestIdRef.current) setLimit(nextLimit)
    } catch (reason) {
      if (requestId === requestIdRef.current) {
        setError(reason instanceof Error ? reason.message : 'Không tải được hạn mức.')
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
