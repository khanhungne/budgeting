import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import type { MonthlyBudget } from '../types'

export const DEMO_BUDGET_STORAGE_KEY = 'vi-nho.demo.budgets.v1'
const BUDGET_COLUMNS = 'id,user_id,month_start,amount,created_at,updated_at'

const readDemoBudgets = (): MonthlyBudget[] => {
  return readLocalArray<MonthlyBudget>(DEMO_BUDGET_STORAGE_KEY) ?? []
}

const writeDemoBudgets = (budgets: MonthlyBudget[]) => {
  writeLocalArray(DEMO_BUDGET_STORAGE_KEY, budgets)
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

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('monthly_budgets')
    .select(BUDGET_COLUMNS)
    .eq('user_id', userId)
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

  const client = await getSupabaseClient()
  const { data, error } = await client
    .from('monthly_budgets')
    .upsert(
      { user_id: userId, month_start: monthStart, amount },
      { onConflict: 'user_id,month_start' },
    )
    .select(BUDGET_COLUMNS)
    .single()

  if (error) throw error
  return data as MonthlyBudget
}
