import type { Transaction, TransactionInput } from './types'

type BalanceTransaction = Pick<
  Transaction,
  'wallet_id' | 'kind' | 'amount'
> | Pick<TransactionInput, 'wallet_id' | 'kind' | 'amount'>

const transactionEffect = (transaction: BalanceTransaction) =>
  transaction.kind === 'income'
    ? Number(transaction.amount)
    : -Number(transaction.amount)

export type InsufficientWallet = {
  walletId: string
  currentBalance: number
  projectedBalance: number
}

export const findInsufficientWallet = (
  balances: Record<string, number>,
  nextTransaction: BalanceTransaction | null,
  previousTransaction: BalanceTransaction | null = null,
): InsufficientWallet | null => {
  const projected = { ...balances }
  const affectedWalletIds = new Set<string>()

  if (previousTransaction?.wallet_id && previousTransaction.wallet_id in projected) {
    affectedWalletIds.add(previousTransaction.wallet_id)
    projected[previousTransaction.wallet_id] -= transactionEffect(previousTransaction)
  }

  if (nextTransaction?.wallet_id && nextTransaction.wallet_id in projected) {
    affectedWalletIds.add(nextTransaction.wallet_id)
    projected[nextTransaction.wallet_id] += transactionEffect(nextTransaction)
  }

  for (const walletId of affectedWalletIds) {
    const currentBalance = balances[walletId]
    const projectedBalance = projected[walletId]
    if (projectedBalance < 0 && projectedBalance < currentBalance) {
      return { walletId, currentBalance, projectedBalance }
    }
  }

  return null
}
