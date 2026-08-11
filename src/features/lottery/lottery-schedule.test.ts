import { describe, expect, it } from 'vitest'
import { getLotteryDrawTime, getLotteryStations, marketToRegion } from './lottery-schedule'

describe('lottery schedule', () => {
  it('returns Tuesday southern stations', () => {
    expect(getLotteryStations('south', '2026-08-11')).toEqual(['Bến Tre','Vũng Tàu','Bạc Liêu'])
  })
  it('keeps VIP separate with configured time', () => {
    expect(getLotteryStations('hcm_vip', '2026-08-11')).toEqual(['TP.HCM VIP'])
    expect(getLotteryDrawTime('hcm_vip')).toBe('17:30')
    expect(marketToRegion('hcm_vip')).toBe('south')
  })
})
