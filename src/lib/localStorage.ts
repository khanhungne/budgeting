export const readLocalArray = <T>(key: string): T[] | null => {
  const stored = window.localStorage.getItem(key)
  if (stored === null) return null

  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) return parsed as T[]
  } catch {
    // Xử lý như dữ liệu hỏng ở bên dưới.
  }

  window.localStorage.removeItem(key)
  return null
}

export const writeLocalArray = <T>(key: string, items: T[]) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(items))
  } catch {
    throw new Error(
      'Không thể lưu dữ liệu trên máy. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn.',
    )
  }
}
