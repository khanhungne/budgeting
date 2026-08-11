export type LotteryPlayType = 'lo' | 'de' | 'xien' | 'other'
export type LotteryStatus = 'pending' | 'won' | 'lost'
export type LotteryRegion = 'north' | 'central' | 'south'
export type LotteryMarket = LotteryRegion | 'hanoi_vip' | 'hcm_vip'

export type LotteryEntry = {
  id: string
  user_id: string
  play_type: LotteryPlayType
  region: LotteryRegion
  market: LotteryMarket
  station: string
  numbers: string[]
  hit_numbers: string[]
  stake: number
  payout: number
  status: LotteryStatus
  draw_date: string
  draw_time: string
  result_updated_at: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export type LotteryEntryInput = {
  play_type: LotteryPlayType
  region: LotteryRegion
  market: LotteryMarket
  station: string
  numbers: string[]
  hit_numbers: string[]
  stake: number
  payout: number
  status: LotteryStatus
  draw_date: string
  draw_time: string
  note: string
}
