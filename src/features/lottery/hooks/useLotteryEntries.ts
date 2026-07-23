import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createLotteryEntry,
  fetchLotteryEntries,
  removeLotteryEntry,
  updateLotteryEntry,
} from '../api/lottery'
import type { LotteryEntry, LotteryEntryInput } from '../types'

export const calculateLotteryStats = (entries: LotteryEntry[]) => {
  const resolved = entries.filter((entry) => entry.status !== 'pending')
  const wins = entries.filter((entry) => entry.status === 'won')
  const totalStake = entries.reduce((sum, entry) => sum + Number(entry.stake), 0)
  const totalPayout = entries.reduce((sum, entry) => sum + Number(entry.payout), 0)
  return {
    totalStake,
    totalPayout,
    net: totalPayout - totalStake,
    pending: entries.filter((entry) => entry.status === 'pending').length,
    winRate: resolved.length ? (wins.length / resolved.length) * 100 : 0,
  }
}

export const useLotteryEntries = (userId: string, month: string, enabled = true) => {
  const [entries, setEntries] = useState<LotteryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    if (!userId || !enabled) {
      if (!userId) setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchLotteryEntries(userId, month)
      if (requestId === requestIdRef.current) setEntries(rows)
    } catch (reason) {
      if (requestId === requestIdRef.current) {
        setError(reason instanceof Error ? reason.message : 'Không tải được sổ lô đề.')
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [enabled, month, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = async (input: LotteryEntryInput, editingId?: string) => {
    if (!userId) throw new Error('Chưa xác định được người dùng.')
    requestIdRef.current += 1
    setLoading(false)
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        const updated = await updateLotteryEntry(editingId, input)
        setEntries((current) => {
          if (!updated.draw_date.startsWith(month)) {
            return current.filter((entry) => entry.id !== editingId)
          }
          return current
            .map((entry) => (entry.id === editingId ? updated : entry))
            .sort((first, second) => second.draw_date.localeCompare(first.draw_date))
        })
      } else {
        const created = await createLotteryEntry(userId, input)
        if (created.draw_date.startsWith(month)) {
          setEntries((current) =>
            [created, ...current].sort((first, second) =>
              second.draw_date.localeCompare(first.draw_date),
            ),
          )
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được bản ghi.')
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
      await removeLotteryEntry(id)
      setEntries((current) => current.filter((entry) => entry.id !== id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không xoá được bản ghi.')
      throw reason
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => calculateLotteryStats(entries), [entries])

  return { entries, loading, saving, error, stats, save, remove, refresh }
}
