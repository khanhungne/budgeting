import type { Wallet } from './types'

export const calculateTotalWalletBalance = (
  wallets: Wallet[],
  balances: Record<string, number>,
) =>
  wallets.reduce((total, wallet) => total + (balances[wallet.id] ?? 0), 0)
