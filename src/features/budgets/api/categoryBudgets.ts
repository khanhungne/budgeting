import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import type { CategoryBudget } from '../categoryTypes'

export const DEMO_CATEGORY_BUDGET_STORAGE_KEY = 'vi-nho.demo.category-budgets.v1'
const COLUMNS = 'id,user_id,month_start,category,amount,created_at,updated_at'

const readDemo = () => readLocalArray<CategoryBudget>(DEMO_CATEGORY_BUDGET_STORAGE_KEY) ?? []

export const fetchCategoryBudgets = async (userId: string, month: string) => {
  const monthStart = `${month}-01`
  if (!isSupabaseConfigured) return readDemo().filter((item) => item.user_id === userId && item.month_start === monthStart)
  const client = await getSupabaseClient()
  const { data, error } = await client.from('category_budgets').select(COLUMNS).eq('user_id', userId).eq('month_start', monthStart)
  if (error) throw error
  return (data ?? []) as CategoryBudget[]
}

export const saveCategoryBudget = async (userId: string, month: string, category: string, amount: number) => {
  const monthStart = `${month}-01`
  if (!isSupabaseConfigured) {
    const items = readDemo()
    const existing = items.find((item) => item.user_id === userId && item.month_start === monthStart && item.category === category)
    const now = new Date().toISOString()
    const saved: CategoryBudget = existing ? { ...existing, amount, updated_at: now } : { id: crypto.randomUUID(), user_id: userId, month_start: monthStart, category, amount, created_at: now, updated_at: now }
    writeLocalArray(DEMO_CATEGORY_BUDGET_STORAGE_KEY, [saved, ...items.filter((item) => item.id !== saved.id)])
    return saved
  }
  const client = await getSupabaseClient()
  const { data, error } = await client.from('category_budgets').upsert({ user_id: userId, month_start: monthStart, category, amount }, { onConflict: 'user_id,month_start,category' }).select(COLUMNS).single()
  if (error) throw error
  return data as CategoryBudget
}

export const removeCategoryBudget = async (id: string) => {
  if (!isSupabaseConfigured) {
    writeLocalArray(DEMO_CATEGORY_BUDGET_STORAGE_KEY, readDemo().filter((item) => item.id !== id))
    return
  }
  const client = await getSupabaseClient()
  const { error } = await client.from('category_budgets').delete().eq('id', id)
  if (error) throw error
}
