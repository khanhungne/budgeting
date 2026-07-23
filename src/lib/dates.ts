export const currentMonth = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

export const currentDate = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`
}

export const getMonthBounds = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number)
  const start = `${year}-${String(monthIndex).padStart(2, '0')}-01`
  const next = new Date(year, monthIndex, 1)
  const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`

  return { start, nextMonth }
}

export const shiftMonth = (month: string, offset: number) => {
  const [year, monthIndex] = month.split('-').map(Number)
  const target = new Date(year, monthIndex - 1 + offset, 1)
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
}

export const formatMonth = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex - 1, 1))
}
