import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import { DEMO_TRANSACTION_STORAGE_KEY } from '../../transactions/api/transactions'
import type { Transaction } from '../../transactions/types'
import { DEMO_DEFAULT_WALLET_ID } from '../constants'
import type { Wallet, WalletInput } from '../types'

export const DEMO_WALLET_STORAGE_KEY = 'vi-nho.demo.wallets.v1'

const createDefaultWallet = (userId: string): Wallet => {
  const now = new Date().toISOString()
  return {
    id: DEMO_DEFAULT_WALLET_ID,
    user_id: userId,
    name: 'Tiền mặt',
    kind: 'cash',
    opening_balance: 0,
    color: '#1c5f50',
    is_archived: false,
    created_at: now,
    updated_at: now,
  }
}

const readDemoWallets = (userId: string): Wallet[] => {
  const value = window.localStorage.getItem(DEMO_WALLET_STORAGE_KEY)
  if (value) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed) && parsed.length) return parsed as Wallet[]
    } catch {
      window.localStorage.removeItem(DEMO_WALLET_STORAGE_KEY)
    }
  }
  const wallets = [createDefaultWallet(userId)]
  window.localStorage.setItem(DEMO_WALLET_STORAGE_KEY, JSON.stringify(wallets))
  return wallets
}

const writeDemoWallets = (wallets: Wallet[]) => {
  window.localStorage.setItem(DEMO_WALLET_STORAGE_KEY, JSON.stringify(wallets))
}

const requireClient = () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  return supabase
}

export const fetchWallets = async (userId: string) => {
  if (!isSupabaseConfigured) return readDemoWallets(userId)

  const client = requireClient()
  const { data, error } = await client
    .from('wallets')
    .select('*')
    .order('is_archived')
    .order('created_at')

  if (error) throw error
  if (data?.length) {
    const wallets = data as Wallet[]
    const defaultWallet =
      wallets.find((wallet) => !wallet.is_archived) ?? wallets[0]
    const { error: migrationError } = await client
      .from('transactions')
      .update({ wallet_id: defaultWallet.id })
      .is('wallet_id', null)
    if (migrationError) throw migrationError
    return wallets
  }

  const { data: created, error: createError } = await client
    .from('wallets')
    .insert({
      user_id: userId,
      name: 'Tiền mặt',
      kind: 'cash',
      opening_balance: 0,
      color: '#1c5f50',
    })
    .select()
    .single()

  if (createError) throw createError
  const { error: migrationError } = await client
    .from('transactions')
    .update({ wallet_id: (created as Wallet).id })
    .is('wallet_id', null)
  if (migrationError) throw migrationError
  return [created as Wallet]
}

export const fetchWalletBalances = async (wallets: Wallet[]) => {
  const balances = Object.fromEntries(
    wallets.map((wallet) => [wallet.id, Number(wallet.opening_balance)]),
  ) as Record<string, number>

  let transactions: Pick<Transaction, 'wallet_id' | 'kind' | 'amount'>[] = []
  if (!isSupabaseConfigured) {
    const stored = window.localStorage.getItem(DEMO_TRANSACTION_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) transactions = parsed
      } catch {
        // Transaction adapter sẽ tự khôi phục nếu dữ liệu local hỏng.
      }
    }
  } else {
    const { data, error } = await requireClient()
      .from('transactions')
      .select('wallet_id,kind,amount')
    if (error) throw error
    transactions = (data ?? []) as Pick<Transaction, 'wallet_id' | 'kind' | 'amount'>[]
  }

  for (const transaction of transactions) {
    if (!transaction.wallet_id || balances[transaction.wallet_id] === undefined) continue
    const amount = Number(transaction.amount)
    balances[transaction.wallet_id] += transaction.kind === 'income' ? amount : -amount
  }
  return balances
}

export const saveWallet = async (
  userId: string,
  input: WalletInput,
  editingId?: string,
) => {
  const normalized = { ...input, name: input.name.trim() }

  if (!isSupabaseConfigured) {
    const wallets = readDemoWallets(userId)
    const now = new Date().toISOString()
    const existing = editingId ? wallets.find((wallet) => wallet.id === editingId) : null
    const saved: Wallet = existing
      ? { ...existing, ...normalized, updated_at: now }
      : {
          ...normalized,
          id: crypto.randomUUID(),
          user_id: userId,
          is_archived: false,
          created_at: now,
          updated_at: now,
        }
    writeDemoWallets([saved, ...wallets.filter((wallet) => wallet.id !== saved.id)])
    return saved
  }

  const client = requireClient()
  const query = editingId
    ? client.from('wallets').update(normalized).eq('id', editingId)
    : client.from('wallets').insert({ ...normalized, user_id: userId })
  const { data, error } = await query.select().single()
  if (error) throw error
  return data as Wallet
}

export const setWalletArchived = async (userId: string, id: string, archived: boolean) => {
  if (!isSupabaseConfigured) {
    const wallets = readDemoWallets(userId)
    writeDemoWallets(
      wallets.map((wallet) =>
        wallet.id === id
          ? { ...wallet, is_archived: archived, updated_at: new Date().toISOString() }
          : wallet,
      ),
    )
    return
  }

  const { error } = await requireClient()
    .from('wallets')
    .update({ is_archived: archived })
    .eq('id', id)
  if (error) throw error
}
