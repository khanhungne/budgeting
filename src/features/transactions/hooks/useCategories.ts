import { useCallback, useEffect, useState } from 'react'
import { createCategory, deleteCategory, fetchCategories, updateCategory, type CategoryInput, type StoredCategory } from '../api/categories'

export const useCategories = (userId: string, enabled = true) => {
  const [categories, setCategories] = useState<StoredCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    if (!userId || !enabled) return setLoading(false)
    setLoading(true)
    try { setCategories(await fetchCategories(userId)); setError(null) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được danh mục.') }
    finally { setLoading(false) }
  }, [enabled, userId])
  useEffect(() => { void refresh() }, [refresh])
  const save = async (input: CategoryInput, editingId?: string) => {
    setSaving(true); setError(null)
    try {
      const saved = editingId ? await updateCategory(userId, editingId, input) : await createCategory(userId, input)
      setCategories((items) => editingId ? items.map((item) => item.id === editingId ? saved : item) : [...items, saved])
      return saved
    } catch (reason) { const message = reason instanceof Error ? reason.message : 'Không lưu được danh mục.'; setError(message); throw reason }
    finally { setSaving(false) }
  }
  const add = async (kind: CategoryInput['kind'], label: string, emoji = '📌') => save({ kind, label, emoji, color: kind === 'expense' ? '#d97706' : '#059669' })
  const remove = async (id: string) => { setError(null); try { await deleteCategory(userId, id); setCategories((items) => items.filter((item) => item.id !== id)) } catch (reason) { const message = reason instanceof Error ? reason.message : 'Không xóa được danh mục.'; setError(message); throw reason } }
  return { categories, loading, saving, error, add, save, remove, refresh }
}
