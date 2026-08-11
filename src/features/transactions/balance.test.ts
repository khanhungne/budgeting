import { describe, expect, it } from 'vitest'
import { findInsufficientWallet } from './balance'

describe('transaction balance guard', () => {
  it('blocks a new expense larger than the selected wallet balance', () => {
    expect(
      findInsufficientWallet(
        { cash: 500_000 },
        { wallet_id: 'cash', kind: 'expense', amount: 700_000 },
      ),
    ).toEqual({
      walletId: 'cash',
      currentBalance: 500_000,
      projectedBalance: -200_000,
    })
  })

  it('allows editing an expense without counting its old value twice', () => {
    expect(
      findInsufficientWallet(
        { cash: 300_000 },
        { wallet_id: 'cash', kind: 'expense', amount: 600_000 },
        { wallet_id: 'cash', kind: 'expense', amount: 500_000 },
      ),
    ).toBeNull()
  })

  it('allows an operation that repairs a legacy negative balance', () => {
    expect(
      findInsufficientWallet(
        { cash: -1_000_000 },
        { wallet_id: 'cash', kind: 'income', amount: 500_000 },
      ),
    ).toBeNull()
  })

  it('blocks deleting income when that would make the wallet negative', () => {
    expect(
      findInsufficientWallet(
        { bank: 400_000 },
        null,
        { wallet_id: 'bank', kind: 'income', amount: 500_000 },
      ),
    ).toEqual({
      walletId: 'bank',
      currentBalance: 400_000,
      projectedBalance: -100_000,
    })
  })
})
