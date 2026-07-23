import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import type { LotteryMonthlyLimit } from '../limitTypes'

export const DEMO_LOTTERY_LIMIT_STORAGE_KEY = 'vi-nho.demo.lottery-limits.v1'

const readDemoLimits = (): LotteryMonthlyLimit[] => {
  const stored = window.localStorage.getItem(DEMO_LOTTERY_LIMIT_STORAGE_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as LotteryMonthlyLimit[]) : []
  } catch {
    window.localStorage.removeItem(DEMO_LOTTERY_LIMIT_STORAGE_KEY)
    return []
  }
}

const writeDemoLimits = (limits: LotteryMonthlyLimit[]) => {
  window.localStorage.setItem(DEMO_LOTTERY_LIMIT_STORAGE_KEY, JSON.stringify(limits))
}

const requireClient = () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  return supabase
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

  const { data, error } = await requireClient()
    .from('lottery_limits')
    .select('*')
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

  const { data, error } = await requireClient()
    .from('lottery_limits')
    .upsert(
      { user_id: userId, month_start: monthStart, amount },
      { onConflict: 'user_id,month_start' },
    )
    .select()
    .single()

  if (error) throw error
  return data as LotteryMonthlyLimit
}
