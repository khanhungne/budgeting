import type { Wallet } from './types'

export const calculateTotalWalletBalance = (
  wallets: Wallet[],
  balances: Record<string, number>,
) =>
  wallets
    .filter((wallet) => !wallet.is_archived)
    .reduce(
      (total, wallet) =>
        total + (balances[wallet.id] ?? Number(wallet.opening_balance)),
      0,
    )
