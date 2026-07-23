import { describe, expect, it } from 'vitest'
import { formatVndInput, parseVndInput } from './format'

describe('VND input helpers', () => {
  it('formats digit input without decimals', () => {
    expect(formatVndInput('5000000')).toBe('5.000.000')
  })

  it('parses separators and currency text', () => {
    expect(parseVndInput('5.000.000 VND')).toBe(5_000_000)
    expect(parseVndInput('')).toBe(0)
  })
})
