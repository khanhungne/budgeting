import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import type { MonthlyBudget } from '../types'

export const DEMO_BUDGET_STORAGE_KEY = 'vi-nho.demo.budgets.v1'

const readDemoBudgets = (): MonthlyBudget[] => {
  const stored = window.localStorage.getItem(DEMO_BUDGET_STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored) as MonthlyBudget[]
  } catch {
    window.localStorage.removeItem(DEMO_BUDGET_STORAGE_KEY)
    return []
  }
}

const writeDemoBudgets = (budgets: MonthlyBudget[]) => {
  window.localStorage.setItem(DEMO_BUDGET_STORAGE_KEY, JSON.stringify(budgets))
}

const requireClient = () => {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  return supabase
}

export const fetchMonthlyBudget = async (userId: string, month: string) => {
  const monthStart = `${month}-01`

  if (!isSupabaseConfigured) {
    return (
      readDemoBudgets().find(
        (budget) => budget.user_id === userId && budget.month_start === monthStart,
      ) ?? null
    )
  }

  const { data, error } = await requireClient()
    .from('monthly_budgets')
    .select('*')
    .eq('month_start', monthStart)
    .maybeSingle()

  if (error) throw error
  return data as MonthlyBudget | null
}

export const saveMonthlyBudget = async (
  userId: string,
  month: string,
  amount: number,
) => {
  const monthStart = `${month}-01`

  if (!isSupabaseConfigured) {
    const budgets = readDemoBudgets()
    const existing = budgets.find(
      (budget) => budget.user_id === userId && budget.month_start === monthStart,
    )
    const now = new Date().toISOString()
    const saved: MonthlyBudget = existing
      ? { ...existing, amount, updated_at: now }
      : {
          id: crypto.randomUUID(),
          user_id: userId,
          month_start: monthStart,
          amount,
          created_at: now,
          updated_at: now,
        }
    writeDemoBudgets([
      saved,
      ...budgets.filter((budget) => budget.id !== saved.id),
    ])
    return saved
  }

  const { data, error } = await requireClient()
    .from('monthly_budgets')
    .upsert(
      { user_id: userId, month_start: monthStart, amount },
      { onConflict: 'user_id,month_start' },
    )
    .select()
    .single()

  if (error) throw error
  return data as MonthlyBudget
}
