export type LotteryPlayType = 'lo' | 'de' | 'xien' | 'other'
export type LotteryStatus = 'pending' | 'won' | 'lost'
export type LotteryRegion = 'north' | 'central' | 'south'

export type LotteryEntry = {
  id: string
  user_id: string
  play_type: LotteryPlayType
  region: LotteryRegion
  station: string
  numbers: string[]
  stake: number
  payout: number
  status: LotteryStatus
  draw_date: string
  note: string | null
  created_at: string
  updated_at: string
}

export type LotteryEntryInput = {
  play_type: LotteryPlayType
  region: LotteryRegion
  station: string
  numbers: string[]
  stake: number
  payout: number
  status: LotteryStatus
  draw_date: string
  note: string
}
