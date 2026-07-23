import { describe, expect, it } from 'vitest'
import type { Wallet } from './types'
import { calculateTotalWalletBalance } from './balance'

const makeWallet = (
  id: string,
  openingBalance: number,
  archived = false,
): Wallet => ({
  id,
  user_id: 'user',
  name: `Ví ${id}`,
  kind: 'cash',
  opening_balance: openingBalance,
  color: '#1c5f50',
  is_archived: archived,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
})

describe('total wallet balance', () => {
  it('sums current balances of active wallets', () => {
    const wallets = [
      makeWallet('cash', 1_000_000),
      makeWallet('bank', 2_000_000),
    ]

    expect(
      calculateTotalWalletBalance(wallets, {
        cash: 1_500_000,
        bank: 1_750_000,
      }),
    ).toBe(3_250_000)
  })

  it('falls back to opening balance and excludes archived wallets', () => {
    const wallets = [
      makeWallet('cash', 1_000_000),
      makeWallet('old', 5_000_000, true),
    ]

    expect(calculateTotalWalletBalance(wallets, { old: 8_000_000 })).toBe(
      1_000_000,
    )
  })
})
