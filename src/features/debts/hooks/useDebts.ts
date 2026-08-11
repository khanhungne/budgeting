import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchDebts, removeDebt, saveDebt, setDebtStatus } from '../api/debts'
import type { Debt, DebtInput, DebtStatus } from '../types'

export const useDebts = (userId: string, enabled = true) => {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    if (!userId || !enabled) return setLoading(false)
    setLoading(true)
    try { setDebts(await fetchDebts(userId)); setError(null) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được công nợ.') }
    finally { setLoading(false) }
  }, [enabled, userId])
  useEffect(() => { void refresh() }, [refresh])
  const save = async (input: DebtInput, editingId?: string) => {
    setSaving(true)
    setError(null)
    try {
      const item = await saveDebt(userId, input, editingId)
      setDebts((items) => editingId ? items.map((old) => old.id === editingId ? item : old) : [item, ...items])
      return item
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được khoản nợ.')
      throw reason
    } finally { setSaving(false) }
  }
  const updateStatus = async (id: string, status: DebtStatus) => {
    setError(null)
    try {
      const item = await setDebtStatus(id, status)
      setDebts((items) => items.map((old) => old.id === id ? item : old))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không cập nhật được trạng thái khoản nợ.')
      throw reason
    }
  }
  const remove = async (id: string) => { setError(null); try { await removeDebt(id); setDebts((items) => items.filter((item) => item.id !== id)) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không xóa được khoản nợ.'); throw reason } }
  const totals = useMemo(() => debts.filter((item) => item.status === 'pending').reduce((sum, item) => ({ ...sum, [item.direction]: sum[item.direction] + Number(item.amount) }), { i_owe: 0, owed_to_me: 0 }), [debts])
  return { debts, loading, saving, error, totals, save, updateStatus, remove, refresh }
}
