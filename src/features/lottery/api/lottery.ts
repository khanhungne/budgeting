import { getMonthBounds } from '../../../lib/dates'
import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import type { LotteryEntry, LotteryEntryInput } from '../types'

export const DEMO_LOTTERY_STORAGE_KEY = 'vi-nho.demo.lottery.v1'

const readDemoEntries = (): LotteryEntry[] => {
  const value = window.localStorage.getItem(DEMO_LOTTERY_STORAGE_KEY)
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return (parsed as LotteryEntry[]).map((entry) => ({
      ...entry,
      region: entry.region ?? 'north',
      station: entry.station?.trim() || 'Hà Nội',
    }))
  } catch {
    window.localStorage.removeItem(DEMO_LOTTERY_STORAGE_KEY)
    return []
  }
}

const writeDemoEntries = (entries: LotteryEntry[]) => {
  window.localStorage.setItem(DEMO_LOTTERY_STORAGE_KEY, JSON.stringify(entries))
}

const requireClient = () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  return supabase
}

export const fetchLotteryEntries = async (month: string) => {
  const { start, nextMonth } = getMonthBounds(month)

  if (!isSupabaseConfigured) {
    return readDemoEntries()
      .filter((entry) => entry.draw_date >= start && entry.draw_date < nextMonth)
      .sort(
        (first, second) =>
          second.draw_date.localeCompare(first.draw_date) ||
          second.created_at.localeCompare(first.created_at),
      )
  }

  const { data, error } = await requireClient()
    .from('lottery_entries')
    .select('*')
    .gte('draw_date', start)
    .lt('draw_date', nextMonth)
    .order('draw_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as LotteryEntry[]
}

export const createLotteryEntry = async (userId: string, input: LotteryEntryInput) => {
  const normalized = {
    ...input,
    station: input.station.trim(),
    note: input.note.trim() || null,
  }

  if (!isSupabaseConfigured) {
    const now = new Date().toISOString()
    const entry: LotteryEntry = {
      ...normalized,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: now,
      updated_at: now,
    }
    writeDemoEntries([entry, ...readDemoEntries()])
    return entry
  }

  const { data, error } = await requireClient()
    .from('lottery_entries')
    .insert({ ...normalized, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as LotteryEntry
}

export const updateLotteryEntry = async (id: string, input: LotteryEntryInput) => {
  const normalized = {
    ...input,
    station: input.station.trim(),
    note: input.note.trim() || null,
  }

  if (!isSupabaseConfigured) {
    const entries = readDemoEntries()
    const existing = entries.find((entry) => entry.id === id)
    if (!existing) throw new Error('Không tìm thấy bản ghi.')
    const updated: LotteryEntry = {
      ...existing,
      ...normalized,
      updated_at: new Date().toISOString(),
    }
    writeDemoEntries(entries.map((entry) => (entry.id === id ? updated : entry)))
    return updated
  }

  const { data, error } = await requireClient()
    .from('lottery_entries')
    .update(normalized)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as LotteryEntry
}

export const removeLotteryEntry = async (id: string) => {
  if (!isSupabaseConfigured) {
    writeDemoEntries(readDemoEntries().filter((entry) => entry.id !== id))
    return
  }

  const { error } = await requireClient().from('lottery_entries').delete().eq('id', id)
  if (error) throw error
}
