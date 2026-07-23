export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0,
  }).format(amount)

export const formatCompactCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)

export const parseVndInput = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export const formatVndInput = (value: string | number) => {
  const amount = typeof value === 'number' ? value : parseVndInput(value)
  return amount > 0
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount)
    : ''
}

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))

export const getInitials = (email?: string) =>
  email?.slice(0, 2).toUpperCase() ?? 'VN'
