import type { Category } from './types'

export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Ăn uống', emoji: '🍜', kind: 'expense', color: '#ef8f67' },
  { id: 'transport', label: 'Đi lại', emoji: '🛵', kind: 'expense', color: '#6fa8dc' },
  { id: 'shopping', label: 'Mua sắm', emoji: '🛍️', kind: 'expense', color: '#bf8ed8' },
  { id: 'bills', label: 'Hoá đơn', emoji: '🧾', kind: 'expense', color: '#e6b85c' },
  { id: 'health', label: 'Sức khoẻ', emoji: '💊', kind: 'expense', color: '#e67b88' },
  { id: 'education', label: 'Học tập', emoji: '📚', kind: 'expense', color: '#6ab5a1' },
  { id: 'fun', label: 'Giải trí', emoji: '🎮', kind: 'expense', color: '#778bd4' },
  { id: 'other-expense', label: 'Khác', emoji: '📦', kind: 'expense', color: '#9aa19d' },
  { id: 'salary', label: 'Lương', emoji: '💼', kind: 'income', color: '#4ca77b' },
  { id: 'bonus', label: 'Thưởng', emoji: '🎁', kind: 'income', color: '#71b45d' },
  { id: 'investment', label: 'Đầu tư', emoji: '📈', kind: 'income', color: '#3e91a3' },
  { id: 'other-income', label: 'Thu khác', emoji: '💰', kind: 'income', color: '#72a96b' },
]

export const getCategory = (id: string) =>
  CATEGORIES.find((category) => category.id === id) ?? {
    id,
    label: 'Khác',
    emoji: '📦',
    kind: 'expense' as const,
    color: '#9aa19d',
  }
