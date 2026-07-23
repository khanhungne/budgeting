import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import { DEMO_TRANSACTION_STORAGE_KEY } from '../../transactions/api/transactions'
import type { Transaction } from '../../transactions/types'
import { DEMO_DEFAULT_WALLET_ID } from '../constants'
import type { Wallet, WalletInput } from '../types'

export const DEMO_WALLET_STORAGE_KEY = 'vi-nho.demo.wallets.v1'
const WALLET_COLUMNS =
  'id,user_id,name,kind,opening_balance,color,is_archived,created_at,updated_at'

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
  const stored = readLocalArray<Wallet>(DEMO_WALLET_STORAGE_KEY)
  if (stored?.length) return stored
  const wallets = [createDefaultWallet(userId)]
  writeLocalArray(DEMO_WALLET_STORAGE_KEY, wallets)
  return wallets
}

const writeDemoWallets = (wallets: Wallet[]) => {
  writeLocalArray(DEMO_WALLET_STORAGE_KEY, wallets)
}

export const fetchWallets = async (userId: string) => {
  if (!isSupabaseConfigured) return readDemoWallets(userId)

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('wallets')
    .select(WALLET_COLUMNS)
    .eq('user_id', userId)
    .order('is_archived')
    .order('created_at')

  if (error) throw error
  if (data?.length) return data as Wallet[]

  const { data: created, error: createError } = await client
    .from('wallets')
    .insert({
      user_id: userId,
      name: 'Tiền mặt',
      kind: 'cash',
      opening_balance: 0,
      color: '#1c5f50',
    })
    .select(WALLET_COLUMNS)
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
    transactions =
      readLocalArray<Pick<Transaction, 'wallet_id' | 'kind' | 'amount'>>(
        DEMO_TRANSACTION_STORAGE_KEY,
      ) ?? []
  } else {
    const client = await getSupabaseClient()
    const { data: aggregated } = await client
      .from('wallet_balances')
      .select('wallet_id,balance')
      .eq('user_id', wallets[0]?.user_id ?? '')

    if (aggregated) {
      for (const row of aggregated as Array<{
        wallet_id: string
        balance: number | string
      }>) {
        if (balances[row.wallet_id] !== undefined) {
          balances[row.wallet_id] = Number(row.balance)
        }
      }
      return balances
    }

    const { data, error } = await client
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

  const client = await getSupabaseClient()
  const query = editingId
    ? client.from('wallets').update(normalized).eq('id', editingId)
    : client.from('wallets').insert({ ...normalized, user_id: userId })
  const { data, error } = await query.select(WALLET_COLUMNS).single()
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

  const client = await getSupabaseClient()
  const { error } = await client
    .from('wallets')
    .update({ is_archived: archived })
    .eq('id', id)
  if (error) throw error
}
