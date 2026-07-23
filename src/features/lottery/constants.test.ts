import { describe, expect, it } from 'vitest'
import { LOTTERY_STATIONS, normalizeLotteryNumbers } from './constants'

describe('lottery constants', () => {
  it('contains the regional station sets and requested VIP options', () => {
    expect(LOTTERY_STATIONS.north).toHaveLength(7)
    expect(LOTTERY_STATIONS.central).toHaveLength(14)
    expect(LOTTERY_STATIONS.south).toHaveLength(22)
    expect(LOTTERY_STATIONS.north).toContain('Hà Nội VIP')
    expect(LOTTERY_STATIONS.south).toContain('TP.HCM VIP')
  })

  it('normalizes separators and removes duplicate numbers', () => {
    expect(normalizeLotteryNumbers('12, 34;12\n56')).toEqual(['12', '34', '56'])
  })
})
