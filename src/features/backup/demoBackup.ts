import { DEMO_BUDGET_STORAGE_KEY } from '../budgets/api/budgets'
import { readLocalArray, writeLocalArray } from '../../lib/localStorage'
import type { MonthlyBudget } from '../budgets/types'
import { DEMO_LOTTERY_STORAGE_KEY } from '../lottery/api/lottery'
import { DEMO_LOTTERY_LIMIT_STORAGE_KEY } from '../lottery/api/limits'
import type { LotteryMonthlyLimit } from '../lottery/limitTypes'
import type { LotteryEntry } from '../lottery/types'
import { DEMO_TRANSACTION_STORAGE_KEY } from '../transactions/api/transactions'
import type { Transaction } from '../transactions/types'
import { DEMO_WALLET_STORAGE_KEY } from '../wallets/api/wallets'
import { DEMO_DEFAULT_WALLET_ID } from '../wallets/constants'
import type { Wallet } from '../wallets/types'

const DEMO_USER_ID = 'demo-local-user'

type DemoBackup = {
  app: 'vi-nho'
  version: 1 | 2 | 3 | 4
  currency: 'VND'
  exported_at: string
  transactions: Transaction[]
  monthly_budgets: MonthlyBudget[]
  lottery_entries?: LotteryEntry[]
  lottery_limits?: LotteryMonthlyLimit[]
  wallets?: Wallet[]
}

const readArray = <T>(key: string): T[] => {
  return readLocalArray<T>(key) ?? []
}

const isTransaction = (value: unknown): value is Transaction => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Transaction>
  return (
    typeof item.id === 'string' &&
    (item.kind === 'expense' || item.kind === 'income') &&
    typeof item.amount === 'number' &&
    Number.isSafeInteger(item.amount) &&
    item.amount > 0 &&
    typeof item.category === 'string' &&
    typeof item.occurred_on === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.occurred_on)
  )
}

const isMonthlyBudget = (value: unknown): value is MonthlyBudget => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<MonthlyBudget>
  return (
    typeof item.id === 'string' &&
    typeof item.amount === 'number' &&
    Number.isSafeInteger(item.amount) &&
    item.amount > 0 &&
    typeof item.month_start === 'string' &&
    /^\d{4}-\d{2}-01$/.test(item.month_start)
  )
}

const isLotteryEntry = (value: unknown): value is LotteryEntry => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<LotteryEntry>
  return (
    typeof item.id === 'string' &&
    (item.play_type === 'lo' ||
      item.play_type === 'de' ||
      item.play_type === 'xien' ||
      item.play_type === 'other') &&
    Array.isArray(item.numbers) &&
    item.numbers.length > 0 &&
    item.numbers.every((number) => typeof number === 'string' && /^\d{2}$/.test(number)) &&
    (item.region === undefined ||
      item.region === 'north' ||
      item.region === 'central' ||
      item.region === 'south') &&
    (item.station === undefined ||
      (typeof item.station === 'string' &&
        item.station.trim().length > 0 &&
        item.station.length <= 60)) &&
    typeof item.stake === 'number' &&
    Number.isSafeInteger(item.stake) &&
    item.stake > 0 &&
    typeof item.payout === 'number' &&
    Number.isSafeInteger(item.payout) &&
    item.payout >= 0 &&
    (item.status === 'pending' || item.status === 'won' || item.status === 'lost') &&
    typeof item.draw_date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.draw_date)
  )
}

const isWallet = (value: unknown): value is Wallet => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Wallet>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    item.name.length <= 60 &&
    (item.kind === 'cash' ||
      item.kind === 'bank' ||
      item.kind === 'ewallet' ||
      item.kind === 'other') &&
    typeof item.opening_balance === 'number' &&
    Number.isSafeInteger(item.opening_balance) &&
    item.opening_balance >= 0 &&
    typeof item.color === 'string' &&
    /^#[0-9a-f]{6}$/i.test(item.color) &&
    typeof item.is_archived === 'boolean'
  )
}

const isLotteryLimit = (value: unknown): value is LotteryMonthlyLimit => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<LotteryMonthlyLimit>
  return (
    typeof item.id === 'string' &&
    typeof item.amount === 'number' &&
    Number.isSafeInteger(item.amount) &&
    item.amount > 0 &&
    typeof item.month_start === 'string' &&
    /^\d{4}-\d{2}-01$/.test(item.month_start)
  )
}

export const exportDemoBackup = () => {
  const now = new Date().toISOString()
  const storedWallets = readArray<Wallet>(DEMO_WALLET_STORAGE_KEY)
  const wallets = storedWallets.length
    ? storedWallets
    : [
        {
          id: DEMO_DEFAULT_WALLET_ID,
          user_id: DEMO_USER_ID,
          name: 'Tiền mặt',
          kind: 'cash' as const,
          opening_balance: 0,
          color: '#1c5f50',
          is_archived: false,
          created_at: now,
          updated_at: now,
        },
      ]
  const backup: DemoBackup = {
    app: 'vi-nho',
    version: 4,
    currency: 'VND',
    exported_at: new Date().toISOString(),
    transactions: readArray<Transaction>(DEMO_TRANSACTION_STORAGE_KEY).map((transaction) => ({
      ...transaction,
      wallet_id: transaction.wallet_id ?? DEMO_DEFAULT_WALLET_ID,
    })),
    monthly_budgets: readArray<MonthlyBudget>(DEMO_BUDGET_STORAGE_KEY),
    lottery_entries: readArray<LotteryEntry>(DEMO_LOTTERY_STORAGE_KEY).map((entry) => ({
      ...entry,
      region: entry.region ?? 'north',
      station: entry.station?.trim() || 'Hà Nội',
    })),
    lottery_limits: readArray<LotteryMonthlyLimit>(DEMO_LOTTERY_LIMIT_STORAGE_KEY),
    wallets,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `vi-nho-backup-${date}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const importDemoBackup = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File backup vượt quá giới hạn 5 MB.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('File không phải JSON hợp lệ.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Nội dung backup không hợp lệ.')
  }

  const backup = parsed as Partial<DemoBackup>
  if (
    backup.app !== 'vi-nho' ||
    (backup.version !== 1 &&
      backup.version !== 2 &&
      backup.version !== 3 &&
      backup.version !== 4) ||
    backup.currency !== 'VND'
  ) {
    throw new Error('Đây không phải file backup Ví Nhỏ phiên bản được hỗ trợ.')
  }
  if (!Array.isArray(backup.transactions) || !backup.transactions.every(isTransaction)) {
    throw new Error('Danh sách giao dịch trong backup không hợp lệ.')
  }
  if (!Array.isArray(backup.monthly_budgets) || !backup.monthly_budgets.every(isMonthlyBudget)) {
    throw new Error('Danh sách ngân sách trong backup không hợp lệ.')
  }
  const backupLotteryEntries = backup.lottery_entries ?? []
  if (!Array.isArray(backupLotteryEntries) || !backupLotteryEntries.every(isLotteryEntry)) {
    throw new Error('Danh sách lô đề trong backup không hợp lệ.')
  }
  const backupWallets = backup.wallets ?? []
  if (!Array.isArray(backupWallets) || !backupWallets.every(isWallet)) {
    throw new Error('Danh sách ví trong backup không hợp lệ.')
  }
  const backupLotteryLimits = backup.lottery_limits ?? []
  if (!Array.isArray(backupLotteryLimits) || !backupLotteryLimits.every(isLotteryLimit)) {
    throw new Error('Danh sách hạn mức lô đề trong backup không hợp lệ.')
  }

  const now = new Date().toISOString()
  const importedWallets: Wallet[] = backupWallets.length
    ? backupWallets.map((wallet) => ({
        ...wallet,
        user_id: DEMO_USER_ID,
        updated_at: wallet.updated_at || now,
        created_at: wallet.created_at || now,
      }))
    : [
        {
          id: DEMO_DEFAULT_WALLET_ID,
          user_id: DEMO_USER_ID,
          name: 'Tiền mặt',
          kind: 'cash',
          opening_balance: 0,
          color: '#1c5f50',
          is_archived: false,
          created_at: now,
          updated_at: now,
        },
      ]
  const wallets = importedWallets.some((wallet) => !wallet.is_archived)
    ? importedWallets
    : importedWallets.map((wallet, index) =>
        index === 0 ? { ...wallet, is_archived: false } : wallet,
      )
  const walletIds = new Set(wallets.map((wallet) => wallet.id))
  const fallbackWalletId =
    wallets.find((wallet) => !wallet.is_archived)?.id ?? wallets[0].id
  const transactions = backup.transactions.map((transaction) => ({
    ...transaction,
    user_id: DEMO_USER_ID,
    wallet_id:
      transaction.wallet_id && walletIds.has(transaction.wallet_id)
        ? transaction.wallet_id
        : fallbackWalletId,
    updated_at: transaction.updated_at || now,
    created_at: transaction.created_at || now,
  }))
  const budgets = backup.monthly_budgets.map((budget) => ({
    ...budget,
    user_id: DEMO_USER_ID,
    updated_at: budget.updated_at || now,
    created_at: budget.created_at || now,
  }))
  const lotteryEntries = backupLotteryEntries.map((entry) => ({
    ...entry,
    user_id: DEMO_USER_ID,
    region: entry.region ?? 'north',
    station: entry.station?.trim() || 'Hà Nội',
    updated_at: entry.updated_at || now,
    created_at: entry.created_at || now,
  }))
  const lotteryLimits = backupLotteryLimits.map((limit) => ({
    ...limit,
    user_id: DEMO_USER_ID,
    updated_at: limit.updated_at || now,
    created_at: limit.created_at || now,
  }))

  writeLocalArray(DEMO_WALLET_STORAGE_KEY, wallets)
  writeLocalArray(DEMO_TRANSACTION_STORAGE_KEY, transactions)
  writeLocalArray(DEMO_BUDGET_STORAGE_KEY, budgets)
  writeLocalArray(DEMO_LOTTERY_STORAGE_KEY, lotteryEntries)
  writeLocalArray(DEMO_LOTTERY_LIMIT_STORAGE_KEY, lotteryLimits)

  return {
    transactionCount: transactions.length,
    budgetCount: budgets.length,
    lotteryCount: lotteryEntries.length,
    lotteryLimitCount: lotteryLimits.length,
    walletCount: wallets.length,
  }
}
