import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import type { LotteryMonthlyLimit } from '../limitTypes'

export const DEMO_LOTTERY_LIMIT_STORAGE_KEY = 'vi-nho.demo.lottery-limits.v1'
const LIMIT_COLUMNS = 'id,user_id,month_start,amount,created_at,updated_at'

const readDemoLimits = (): LotteryMonthlyLimit[] => {
  return readLocalArray<LotteryMonthlyLimit>(DEMO_LOTTERY_LIMIT_STORAGE_KEY) ?? []
}

const writeDemoLimits = (limits: LotteryMonthlyLimit[]) => {
  writeLocalArray(DEMO_LOTTERY_LIMIT_STORAGE_KEY, limits)
}

export const fetchLotteryMonthlyLimit = async (userId: string, month: string) => {
  const monthStart = `${month}-01`
  if (!isSupabaseConfigured) {
    return (
      readDemoLimits().find(
        (limit) => limit.user_id === userId && limit.month_start === monthStart,
      ) ?? null
    )
  }

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('lottery_limits')
    .select(LIMIT_COLUMNS)
    .eq('user_id', userId)
    .eq('month_start', monthStart)
    .maybeSingle()

  if (error) throw error
  return data as LotteryMonthlyLimit | null
}

export const saveLotteryMonthlyLimit = async (
  userId: string,
  month: string,
  amount: number,
) => {
  const monthStart = `${month}-01`
  if (!isSupabaseConfigured) {
    const limits = readDemoLimits()
    const existing = limits.find(
      (limit) => limit.user_id === userId && limit.month_start === monthStart,
    )
    const now = new Date().toISOString()
    const saved: LotteryMonthlyLimit = existing
      ? { ...existing, amount, updated_at: now }
      : {
          id: crypto.randomUUID(),
          user_id: userId,
          month_start: monthStart,
          amount,
          created_at: now,
          updated_at: now,
        }
    writeDemoLimits([saved, ...limits.filter((limit) => limit.id !== saved.id)])
    return saved
  }

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('lottery_limits')
    .upsert(
      { user_id: userId, month_start: monthStart, amount },
      { onConflict: 'user_id,month_start' },
    )
    .select(LIMIT_COLUMNS)
    .single()

  if (error) throw error
  return data as LotteryMonthlyLimit
}
