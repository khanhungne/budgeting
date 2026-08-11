import { useCallback, useEffect, useState } from 'react'
import { fetchCategoryBudgets, removeCategoryBudget, saveCategoryBudget } from '../api/categoryBudgets'
import type { CategoryBudget } from '../categoryTypes'

export const useCategoryBudgets = (userId: string, month: string, enabled = true) => {
  const [budgets, setBudgets] = useState<CategoryBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    if (!userId || !enabled) return setLoading(false)
    setLoading(true)
    setError(null)
    try {
      setBudgets(await fetchCategoryBudgets(userId, month))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tải ngân sách theo danh mục.')
    } finally { setLoading(false) }
  }, [enabled, month, userId])
  useEffect(() => { void refresh() }, [refresh])
  const save = async (category: string, amount: number) => {
    setSaving(true)
    setError(null)
    try {
      const saved = await saveCategoryBudget(userId, month, category, amount)
      setBudgets((items) => [saved, ...items.filter((item) => item.id !== saved.id)])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu ngân sách theo danh mục.')
      throw cause
    } finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    setError(null)
    try {
      await removeCategoryBudget(id)
      setBudgets((items) => items.filter((item) => item.id !== id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xóa ngân sách theo danh mục.')
      throw cause
    }
  }
  return { budgets, loading, saving, error, save, remove, refresh }
}
