import { describe, expect, it } from 'vitest'
import type { LotteryEntry } from '../types'
import { calculateLotteryStats } from './useLotteryEntries'

const makeEntry = (
  id: string,
  status: LotteryEntry['status'],
  stake: number,
  payout: number,
): LotteryEntry => ({
  id,
  user_id: 'user',
  play_type: 'lo',
  region: 'north',
  station: 'Hà Nội',
  numbers: ['12'],
  stake,
  payout,
  status,
  draw_date: '2026-07-01',
  note: null,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
})

describe('lottery stats', () => {
  it('calculates cash flow and win rate only from resolved records', () => {
    const result = calculateLotteryStats([
      makeEntry('1', 'won', 100_000, 300_000),
      makeEntry('2', 'lost', 50_000, 0),
      makeEntry('3', 'pending', 20_000, 0),
    ])

    expect(result).toEqual({
      totalStake: 170_000,
      totalPayout: 300_000,
      net: 130_000,
      pending: 1,
      winRate: 50,
    })
  })
})
