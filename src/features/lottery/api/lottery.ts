import { getMonthBounds } from '../../../lib/dates'
import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import type { LotteryEntry, LotteryEntryInput } from '../types'

export const DEMO_LOTTERY_STORAGE_KEY = 'vi-nho.demo.lottery.v1'
const LOTTERY_COLUMNS =
  'id,user_id,play_type,region,station,numbers,stake,payout,status,draw_date,note,created_at,updated_at'

const readDemoEntries = (): LotteryEntry[] => {
  return (readLocalArray<LotteryEntry>(DEMO_LOTTERY_STORAGE_KEY) ?? []).map(
    (entry) => ({
      ...entry,
      region: entry.region ?? 'north',
      station: entry.station?.trim() || 'Hà Nội',
    }),
  )
}

const writeDemoEntries = (entries: LotteryEntry[]) => {
  writeLocalArray(DEMO_LOTTERY_STORAGE_KEY, entries)
}

export const fetchLotteryEntries = async (userId: string, month: string) => {
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

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('lottery_entries')
    .select(LOTTERY_COLUMNS)
    .eq('user_id', userId)
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

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('lottery_entries')
    .insert({ ...normalized, user_id: userId })
    .select(LOTTERY_COLUMNS)
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

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('lottery_entries')
    .update(normalized)
    .eq('id', id)
    .select(LOTTERY_COLUMNS)
    .single()

  if (error) throw error
  return data as LotteryEntry
}

export const removeLotteryEntry = async (id: string) => {
  if (!isSupabaseConfigured) {
    writeDemoEntries(readDemoEntries().filter((entry) => entry.id !== id))
    return
  }

  const client = await getSupabaseClient()
  const { error } = await client.from('lottery_entries').delete().eq('id', id)
  if (error) throw error
}
