import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchWalletBalances,
  fetchWallets,
  saveWallet,
  setWalletArchived,
} from '../api/wallets'
import type { Wallet, WalletInput } from '../types'

export const useWallets = (userId: string, includeBalances = false) => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [walletsLoading, setWalletsLoading] = useState(true)
  const [balancesLoading, setBalancesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current
    if (!userId) {
      setWallets([])
      setBalances({})
      setWalletsLoading(false)
      return
    }
    setWalletsLoading(true)
    setError(null)
    try {
      const nextWallets = await fetchWallets(userId)
      if (requestId === requestIdRef.current) {
        setWallets(nextWallets)
        setBalances(
          Object.fromEntries(
            nextWallets.map((wallet) => [wallet.id, Number(wallet.opening_balance)]),
          ),
        )
      }
    } catch (reason) {
      if (requestId === requestIdRef.current) {
        setError(
          reason instanceof Error ? reason.message : 'Không tải được danh sách ví.',
        )
      }
    } finally {
      if (requestId === requestIdRef.current) setWalletsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const refreshBalances = useCallback(async () => {
    if (!userId || !includeBalances || wallets.length === 0) {
      setBalancesLoading(false)
      return
    }
    const requestId = ++requestIdRef.current
    setBalancesLoading(true)
    setError(null)
    try {
      const nextBalances = await fetchWalletBalances(wallets)
      if (requestId === requestIdRef.current) setBalances(nextBalances)
    } catch (reason) {
      if (requestId === requestIdRef.current) {
        setError(reason instanceof Error ? reason.message : 'Không tính được số dư ví.')
      }
    } finally {
      if (requestId === requestIdRef.current) setBalancesLoading(false)
    }
  }, [includeBalances, userId, wallets])

  useEffect(() => {
    void refreshBalances()
  }, [refreshBalances])

  const save = async (input: WalletInput, editingId?: string) => {
    requestIdRef.current += 1
    setWalletsLoading(false)
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
    requestIdRef.current += 1
    setWalletsLoading(false)
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

  return {
    wallets,
    balances,
    loading: walletsLoading || balancesLoading,
    saving,
    error,
    save,
    toggleArchived,
    refresh,
    refreshBalances,
  }
}
