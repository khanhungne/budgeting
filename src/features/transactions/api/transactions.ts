import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import { currentMonth, getMonthBounds } from '../../../lib/dates'
import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import { DEMO_DEFAULT_WALLET_ID } from '../../wallets/constants'
import type { Transaction, TransactionInput } from '../types'

export const DEMO_TRANSACTION_STORAGE_KEY = 'vi-nho.demo.transactions.v1'
const DEMO_USER_ID = 'demo-local-user'
const TRANSACTION_COLUMNS =
  'id,user_id,wallet_id,kind,amount,category,note,occurred_on,created_at,updated_at'

export type TransactionTrendRow = Pick<
  Transaction,
  'kind' | 'amount' | 'occurred_on'
>

const createDemoSeed = (): Transaction[] => {
  const month = currentMonth()
  const now = new Date().toISOString()
  const items: Array<
    Pick<Transaction, 'kind' | 'amount' | 'category' | 'note' | 'occurred_on'>
  > = [
    {
      kind: 'income',
      amount: 15_000_000,
      category: 'salary',
      note: 'Lương tháng này',
      occurred_on: `${month}-01`,
    },
    {
      kind: 'expense',
      amount: 650_000,
      category: 'bills',
      note: 'Điện, nước và Internet',
      occurred_on: `${month}-03`,
    },
    {
      kind: 'expense',
      amount: 85_000,
      category: 'food',
      note: 'Ăn trưa',
      occurred_on: `${month}-05`,
    },
    {
      kind: 'expense',
      amount: 120_000,
      category: 'transport',
      note: 'Đổ xăng',
      occurred_on: `${month}-08`,
    },
    {
      kind: 'expense',
      amount: 250_000,
      category: 'shopping',
      note: 'Đồ dùng cá nhân',
      occurred_on: `${month}-10`,
    },
  ]

  return items.map((item, index) => ({
    ...item,
    id: `demo-${month}-${index + 1}`,
    user_id: DEMO_USER_ID,
    wallet_id: DEMO_DEFAULT_WALLET_ID,
    created_at: now,
    updated_at: now,
  }))
}

const readDemoTransactions = (): Transaction[] => {
  const parsed = readLocalArray<Transaction>(DEMO_TRANSACTION_STORAGE_KEY)
  if (parsed) {
      let changed = false
      const migrated = parsed.map((transaction) => {
        if (transaction.wallet_id) return transaction
        changed = true
        return {
        ...transaction,
          wallet_id: DEMO_DEFAULT_WALLET_ID,
        }
      })
      if (changed) {
        writeLocalArray(DEMO_TRANSACTION_STORAGE_KEY, migrated)
      }
      return migrated
  }

  const seeded = createDemoSeed()
  writeLocalArray(DEMO_TRANSACTION_STORAGE_KEY, seeded)
  return seeded
}

const writeDemoTransactions = (transactions: Transaction[]) => {
  writeLocalArray(DEMO_TRANSACTION_STORAGE_KEY, transactions)
}

export const fetchTransactions = async (userId: string, month: string) => {
  if (!isSupabaseConfigured) {
    const { start, nextMonth } = getMonthBounds(month)
    return readDemoTransactions()
      .filter(
        (transaction) =>
          transaction.occurred_on >= start && transaction.occurred_on < nextMonth,
      )
      .sort(
        (first, second) =>
          second.occurred_on.localeCompare(first.occurred_on) ||
          second.created_at.localeCompare(first.created_at),
      )
  }

  const client = await getSupabaseClient()
  const { start, nextMonth } = getMonthBounds(month)
  const { data, error } = await client
    .from('transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('user_id', userId)
    .gte('occurred_on', start)
    .lt('occurred_on', nextMonth)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Transaction[]
}

export const fetchTransactionsRange = async (
  userId: string,
  startMonth: string,
  endMonth: string,
) => {
  const { start } = getMonthBounds(startMonth)
  const { nextMonth } = getMonthBounds(endMonth)

  if (!isSupabaseConfigured) {
    return readDemoTransactions()
      .filter(
        (transaction) =>
          transaction.occurred_on >= start && transaction.occurred_on < nextMonth,
      )
      .sort((first, second) => first.occurred_on.localeCompare(second.occurred_on))
      .map(({ kind, amount, occurred_on }) => ({ kind, amount, occurred_on }))
  }

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('transactions')
    .select('kind,amount,occurred_on')
    .eq('user_id', userId)
    .gte('occurred_on', start)
    .lt('occurred_on', nextMonth)
    .order('occurred_on', { ascending: true })

  if (error) throw error
  return (data ?? []) as TransactionTrendRow[]
}

export const createTransaction = async (userId: string, input: TransactionInput) => {
  if (!isSupabaseConfigured) {
    const now = new Date().toISOString()
    const transaction: Transaction = {
      ...input,
      id: crypto.randomUUID(),
      user_id: userId || DEMO_USER_ID,
      note: input.note.trim() || null,
      created_at: now,
      updated_at: now,
    }
    writeDemoTransactions([transaction, ...readDemoTransactions()])
    return transaction
  }

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('transactions')
    .insert({ ...input, user_id: userId })
    .select(TRANSACTION_COLUMNS)
    .single()

  if (error) throw error
  return data as Transaction
}

export const updateTransaction = async (id: string, input: TransactionInput) => {
  if (!isSupabaseConfigured) {
    const transactions = readDemoTransactions()
    const existing = transactions.find((transaction) => transaction.id === id)
    if (!existing) throw new Error('Không tìm thấy giao dịch demo.')

    const updated: Transaction = {
      ...existing,
      ...input,
      note: input.note.trim() || null,
      updated_at: new Date().toISOString(),
    }
    writeDemoTransactions(
      transactions.map((transaction) => (transaction.id === id ? updated : transaction)),
    )
    return updated
  }

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('transactions')
    .update(input)
    .eq('id', id)
    .select(TRANSACTION_COLUMNS)
    .single()

  if (error) throw error
  return data as Transaction
}

export const removeTransaction = async (id: string) => {
  if (!isSupabaseConfigured) {
    writeDemoTransactions(
      readDemoTransactions().filter((transaction) => transaction.id !== id),
    )
    return
  }

  const client = await getSupabaseClient()
  const { error } = await client.from('transactions').delete().eq('id', id)
  if (error) throw error
}
