import type { Transaction } from './types'

export type TransactionCalendarDay = {
  date: string
  day: number
  transactionCount: number
  expenseCount: number
  incomeCount: number
  expense: number
  income: number
  categoryIds: string[]
}

export type TransactionCalendarCell = TransactionCalendarDay | null

const emptyDay = (month: string, day: number): TransactionCalendarDay => ({
  date: `${month}-${String(day).padStart(2, '0')}`,
  day,
  transactionCount: 0,
  expenseCount: 0,
  incomeCount: 0,
  expense: 0,
  income: 0,
  categoryIds: [],
})

export const buildTransactionCalendar = (
  month: string,
  transactions: Transaction[],
): TransactionCalendarCell[] => {
  const [year, monthNumber] = month.split('-').map(Number)
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  const firstWeekday = (new Date(year, monthNumber - 1, 1).getDay() + 6) % 7
  const summaries = new Map(
    Array.from({ length: daysInMonth }, (_, index) => {
      const day = emptyDay(month, index + 1)
      return [day.date, day] as const
    }),
  )

  for (const transaction of transactions) {
    const day = summaries.get(transaction.occurred_on)
    if (!day) continue
    const amount = Number(transaction.amount)
    day.transactionCount += 1
    day[transaction.kind] += amount
    if (transaction.kind === 'expense') day.expenseCount += 1
    else day.incomeCount += 1
    if (!day.categoryIds.includes(transaction.category)) {
      day.categoryIds.push(transaction.category)
    }
  }

  const cells: TransactionCalendarCell[] = [
    ...Array.from<TransactionCalendarCell>({ length: firstWeekday }).fill(null),
    ...summaries.values(),
  ]
  const trailingDays = (7 - (cells.length % 7)) % 7
  cells.push(...Array.from<TransactionCalendarCell>({ length: trailingDays }).fill(null))
  return cells
}

export const suggestedCalendarDate = (
  month: string,
  transactions: Transaction[],
  today: string,
) => {
  if (today.startsWith(`${month}-`)) return today
  const latestDate = transactions
    .map((transaction) => transaction.occurred_on)
    .filter((date) => date.startsWith(`${month}-`))
    .sort((first, second) => second.localeCompare(first))[0]
  return latestDate ?? `${month}-01`
}
