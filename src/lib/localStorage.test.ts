import { afterEach, describe, expect, it, vi } from 'vitest'
import { readLocalArray, writeLocalArray } from './localStorage'

const createStorage = (initial?: Record<string, string>) => {
  const values = new Map(Object.entries(initial ?? {}))
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('local array storage', () => {
  it('reads a valid stored array', () => {
    const localStorage = createStorage({ records: '[{"id":"1"}]' })
    vi.stubGlobal('window', { localStorage })

    expect(readLocalArray<{ id: string }>('records')).toEqual([{ id: '1' }])
  })

  it('removes invalid JSON instead of parsing it repeatedly', () => {
    const localStorage = createStorage({ records: '{broken' })
    vi.stubGlobal('window', { localStorage })

    expect(readLocalArray('records')).toBeNull()
    expect(localStorage.removeItem).toHaveBeenCalledWith('records')
  })

  it('returns a clear error when browser storage rejects a write', () => {
    const localStorage = createStorage()
    localStorage.setItem.mockImplementation(() => {
      throw new Error('quota')
    })
    vi.stubGlobal('window', { localStorage })

    expect(() => writeLocalArray('records', [{ id: '1' }])).toThrow(
      'Không thể lưu dữ liệu trên máy',
    )
  })
})
