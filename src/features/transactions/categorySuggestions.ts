import type { Category, TransactionKind } from './types'

export const CATEGORY_ICONS = ['🍜', '☕', '🏠', '🛵', '🛍️', '🧾', '💊', '📚', '🎮', '✈️', '👨‍👩‍👧', '🐶', '💄', '🎁', '💼', '💰', '📈', '📌']

export const CATEGORY_SUGGESTIONS: Array<Omit<Category, 'id'>> = [
  { label: 'Ăn uống', emoji: '🍜', kind: 'expense', color: '#ef8f67' },
  { label: 'Cà phê', emoji: '☕', kind: 'expense', color: '#a16207' },
  { label: 'Nhà cửa', emoji: '🏠', kind: 'expense', color: '#0f766e' },
  { label: 'Đi lại', emoji: '🛵', kind: 'expense', color: '#6fa8dc' },
  { label: 'Mua sắm', emoji: '🛍️', kind: 'expense', color: '#bf8ed8' },
  { label: 'Hoá đơn', emoji: '🧾', kind: 'expense', color: '#e6b85c' },
  { label: 'Sức khoẻ', emoji: '💊', kind: 'expense', color: '#e67b88' },
  { label: 'Học tập', emoji: '📚', kind: 'expense', color: '#6ab5a1' },
  { label: 'Giải trí', emoji: '🎮', kind: 'expense', color: '#778bd4' },
  { label: 'Du lịch', emoji: '✈️', kind: 'expense', color: '#0284c7' },
  { label: 'Gia đình', emoji: '👨‍👩‍👧', kind: 'expense', color: '#db2777' },
  { label: 'Thú cưng', emoji: '🐶', kind: 'expense', color: '#ca8a04' },
  { label: 'Làm đẹp', emoji: '💄', kind: 'expense', color: '#e11d48' },
  { label: 'Quà tặng', emoji: '🎁', kind: 'expense', color: '#9333ea' },
  { label: 'Lương', emoji: '💼', kind: 'income', color: '#4ca77b' },
  { label: 'Thu nhập phụ', emoji: '💰', kind: 'income', color: '#16a34a' },
  { label: 'Đầu tư', emoji: '📈', kind: 'income', color: '#3e91a3' },
]

export const suggestionsFor = (kind: TransactionKind) =>
  CATEGORY_SUGGESTIONS.filter((item) => item.kind === kind)
