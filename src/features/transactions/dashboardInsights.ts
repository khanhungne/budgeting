import type { Transaction } from './types'

export type DailySpending = {
  date: string
  day: string
  weekday: string
  amount: number
  isFocus: boolean
}

export type DashboardInsights = {
  dailySpending: DailySpending[]
  maxDailySpending: number
  focusLabel: string
  focusExpense: number
  averageExpense: number
  transactionCount: number
  savingsRate: number | null
  topCategory: { id: string; amount: number; share: number } | null
}

const toDateKey = (year: number, monthIndex: number, day: number) =>
  `${year}-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const weekdayLabel = (date: Date) => {
  const day = date.getDay()
  if (day === 0) return 'CN'
  return `T${day + 1}`
}

export const getDashboardInsights = (
  transactions: Transaction[],
  month: string,
  now = new Date(),
): DashboardInsights => {
  const [year, monthNumber] = month.split('-').map(Number)
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === monthNumber
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  const focusDay = isCurrentMonth ? now.getDate() : daysInMonth
  const firstChartDay = Math.max(1, focusDay - 6)
  const expenseByDate = new Map<string, number>()
  const expenseByCategory = new Map<string, number>()

  let totalExpense = 0
  let totalIncome = 0

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount)
    if (transaction.kind === 'income') {
      totalIncome += amount
      return
    }

    totalExpense += amount
    expenseByDate.set(
      transaction.occurred_on,
      (expenseByDate.get(transaction.occurred_on) ?? 0) + amount,
    )
    expenseByCategory.set(
      transaction.category,
      (expenseByCategory.get(transaction.category) ?? 0) + amount,
    )
  })

  const dailySpending = Array.from(
    { length: focusDay - firstChartDay + 1 },
    (_, index) => {
      const day = firstChartDay + index
      const date = toDateKey(year, monthNumber, day)
      return {
        date,
        day: String(day),
        weekday: weekdayLabel(new Date(year, monthNumber - 1, day)),
        amount: expenseByDate.get(date) ?? 0,
        isFocus: day === focusDay,
      }
    },
  )

  const topCategoryEntry = [...expenseByCategory.entries()].sort(
    ([, first], [, second]) => second - first,
  )[0]
  const topCategory = topCategoryEntry
    ? {
        id: topCategoryEntry[0],
        amount: topCategoryEntry[1],
        share: totalExpense ? (topCategoryEntry[1] / totalExpense) * 100 : 0,
      }
    : null

  return {
    dailySpending,
    maxDailySpending: Math.max(...dailySpending.map((item) => item.amount), 1),
    focusLabel: isCurrentMonth ? 'Hôm nay' : `Ngày ${focusDay}/${monthNumber}`,
    focusExpense: expenseByDate.get(toDateKey(year, monthNumber, focusDay)) ?? 0,
    averageExpense: focusDay ? totalExpense / focusDay : 0,
    transactionCount: transactions.length,
    savingsRate: totalIncome ? ((totalIncome - totalExpense) / totalIncome) * 100 : null,
    topCategory,
  }
}
