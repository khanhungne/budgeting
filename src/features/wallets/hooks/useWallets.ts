import { useCallback, useEffect, useState } from 'react'
import {
  fetchWalletBalances,
  fetchWallets,
  saveWallet,
  setWalletArchived,
} from '../api/wallets'
import type { Wallet, WalletInput } from '../types'

export const useWallets = (userId: string) => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setWallets([])
      setBalances({})
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const nextWallets = await fetchWallets(userId)
      setWallets(nextWallets)
      setBalances(await fetchWalletBalances(nextWallets))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không tải được danh sách ví.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = async (input: WalletInput, editingId?: string) => {
    setSaving(true)
    setError(null)
    try {
      await saveWallet(userId, input, editingId)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được ví.')
      throw reason
    } finally {
      setSaving(false)
    }
  }

  const toggleArchived = async (id: string, archived: boolean) => {
    setSaving(true)
    try {
      await setWalletArchived(userId, id, archived)
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không đổi được trạng thái ví.')
      throw reason
    } finally {
      setSaving(false)
    }
  }

  return { wallets, balances, loading, saving, error, save, toggleArchived, refresh }
}
