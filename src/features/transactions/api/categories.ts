import { readLocalArray, writeLocalArray } from '../../../lib/localStorage'
import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase'
import { CATEGORIES } from '../constants'
import type { Category, TransactionKind } from '../types'

export type StoredCategory = Category & {
  user_id: string
  created_at: string
  updated_at: string
}
export type CategoryInput = { label: string; emoji: string; kind: TransactionKind; color: string }

export const DEMO_CATEGORY_STORAGE_KEY = 'vi-nho.demo.categories.v2'
const COLUMNS = 'id,user_id,label,emoji,kind,color,created_at,updated_at'
const readDemo = () => readLocalArray<StoredCategory>(DEMO_CATEGORY_STORAGE_KEY) ?? []
const defaultsFor = (userId: string): StoredCategory[] => {
  const now = new Date().toISOString()
  return CATEGORIES.map((item) => ({ ...item, user_id: userId, created_at: now, updated_at: now }))
}
const categoryError = (error: { code?: string; message?: string }) =>
  error.code === 'PGRST205' || error.message?.includes("public.categories")
    ? new Error('Supabase chưa có bảng categories. Hãy chạy migration tạo danh mục.')
    : error

export const fetchCategories = async (userId: string) => {
  if (!isSupabaseConfigured) {
    const stored = readDemo().filter((item) => item.user_id === userId)
    if (stored.length) return stored
    const legacy = (readLocalArray<StoredCategory>('vi-nho.demo.categories.v1') ?? [])
      .filter((item) => item.user_id === userId)
    const seeded = [...defaultsFor(userId)]
    legacy.forEach((item) => {
      if (!seeded.some((existing) => existing.id === item.id)) seeded.push(item)
    })
    writeLocalArray(DEMO_CATEGORY_STORAGE_KEY, seeded)
    return seeded
  }
  const client = await getSupabaseClient()
  let response = await client.from('categories').select(COLUMNS).eq('user_id', userId).order('created_at')
  if (response.error) throw categoryError(response.error)
  if (!response.data?.length) {
    const { error } = await client.from('categories').insert(defaultsFor(userId).map(({ created_at: _created, updated_at: _updated, ...item }) => item))
    if (error) throw categoryError(error)
    response = await client.from('categories').select(COLUMNS).eq('user_id', userId).order('created_at')
    if (response.error) throw categoryError(response.error)
  }
  return (response.data ?? []) as StoredCategory[]
}

export const createCategory = async (userId: string, input: CategoryInput) => {
  const id = `custom:${input.kind}:📌:${input.label.trim().replaceAll(':', '-')}`.slice(0, 40)
  const clean = { ...input, label: input.label.trim(), emoji: input.emoji.trim() || '📌' }
  if (!isSupabaseConfigured) {
    if (readDemo().some((item) => item.user_id === userId && item.id === id)) throw new Error('Tên danh mục này đã tồn tại.')
    const now = new Date().toISOString()
    const saved: StoredCategory = { id, user_id: userId, ...clean, created_at: now, updated_at: now }
    writeLocalArray(DEMO_CATEGORY_STORAGE_KEY, [...readDemo(), saved])
    return saved
  }
  const client = await getSupabaseClient()
  const { data, error } = await client.from('categories').insert({ id, user_id: userId, ...clean }).select(COLUMNS).single()
  if (error) throw error.code === '23505' ? new Error('Tên danh mục này đã tồn tại.') : categoryError(error)
  return data as StoredCategory
}

export const updateCategory = async (userId: string, id: string, input: CategoryInput) => {
  const clean = { ...input, label: input.label.trim(), emoji: input.emoji.trim() || '📌' }
  if (!isSupabaseConfigured) {
    const items = readDemo(); const existing = items.find((item) => item.user_id === userId && item.id === id)
    if (!existing) throw new Error('Không tìm thấy danh mục.')
    const saved: StoredCategory = { ...existing, ...clean, updated_at: new Date().toISOString() }
    writeLocalArray(DEMO_CATEGORY_STORAGE_KEY, items.map((item) => item.user_id === userId && item.id === id ? saved : item))
    return saved
  }
  const client = await getSupabaseClient()
  const { data, error } = await client.from('categories').update(clean).eq('id', id).eq('user_id', userId).select(COLUMNS).single()
  if (error) throw categoryError(error)
  return data as StoredCategory
}

export const deleteCategory = async (userId: string, id: string) => {
  if (!isSupabaseConfigured) {
    const usedByTransaction = (readLocalArray<{ category: string }>('vi-nho.demo.transactions.v1') ?? []).some((item) => item.category === id)
    const usedByBudget = (readLocalArray<{ category: string }>('vi-nho.demo.category-budgets.v1') ?? []).some((item) => item.category === id)
    if (usedByTransaction || usedByBudget) throw new Error('Danh mục đang được sử dụng. Hãy xóa giao dịch/ngân sách liên quan trước.')
    writeLocalArray(DEMO_CATEGORY_STORAGE_KEY, readDemo().filter((item) => !(item.user_id === userId && item.id === id)))
    return
  }
  const client = await getSupabaseClient()
  const { error } = await client.from('categories').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error.code === '23503' ? new Error('Danh mục đang được sử dụng. Hãy xóa giao dịch/ngân sách liên quan trước.') : categoryError(error)
}
