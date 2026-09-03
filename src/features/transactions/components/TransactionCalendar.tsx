import { useMemo } from 'react'
import { currentDate } from '../../../lib/dates'
import { formatDate } from '../../../lib/format'
import { buildTransactionCalendar } from '../calendar'
import { getCategory } from '../constants'
import type { Category, Transaction } from '../types'

type TransactionCalendarProps = {
  month: string
  transactions: Transaction[]
  categories: Category[]
  selectedDate: string
  onSelectDate: (date: string) => void
}

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export const TransactionCalendar = ({
  month,
  transactions,
  categories,
  selectedDate,
  onSelectDate,
}: TransactionCalendarProps) => {
  const cells = useMemo(
    () => buildTransactionCalendar(month, transactions),
    [month, transactions],
  )
  const today = currentDate()

  return (
    <section className="rounded-[1.75rem] bg-white p-3 shadow-[0_8px_26px_rgba(23,48,40,0.05)]">
      <div className="grid grid-cols-7 gap-1 px-0.5 pb-2">
        {weekdays.map((weekday) => (
          <span
            key={weekday}
            className="py-1 text-center text-[10px] font-black uppercase text-slate-400"
          >
            {weekday}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} aria-hidden="true" />

          const selected = day.date === selectedDate
          const hasExpense = day.expenseCount > 0
          const hasIncome = day.incomeCount > 0
          const cellTone = selected
            ? 'bg-emerald-950 text-white shadow-md'
            : hasExpense
              ? 'bg-orange-50 text-slate-800'
              : hasIncome
                ? 'bg-emerald-50 text-slate-800'
                : 'bg-slate-50 text-slate-500'
          const label = `${formatDate(day.date)}: ${day.expenseCount} khoản chi, ${day.incomeCount} khoản thu`

          return (
            <button
              key={day.date}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              onClick={() => onSelectDate(day.date)}
              className={`relative flex min-h-[3.75rem] min-w-0 flex-col items-center justify-between overflow-hidden rounded-xl px-0.5 py-1.5 transition active:scale-95 ${cellTone} ${
                day.date === today && !selected ? 'ring-2 ring-amber-400 ring-inset' : ''
              }`}
            >
              <span className="text-[10px] font-black">{day.day}</span>
              {day.transactionCount > 0 ? (
                <>
                  <span className="flex h-5 items-center justify-center -space-x-1 text-[13px]">
                    {day.categoryIds.slice(0, 2).map((categoryId) => (
                      <span
                        key={categoryId}
                        className="grid size-5 place-items-center rounded-full bg-white/85 shadow-sm"
                      >
                        {getCategory(categoryId, categories).emoji}
                      </span>
                    ))}
                  </span>
                  <span
                    className={`max-w-full truncate rounded-full px-1.5 py-0.5 text-[8px] font-black ${
                      selected
                        ? 'bg-white/15 text-white'
                        : hasExpense
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {hasExpense ? `${day.expenseCount} chi` : `${day.incomeCount} thu`}
                  </span>
                </>
              ) : (
                <span className="mb-1 size-1 rounded-full bg-slate-200" />
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-3 px-1 text-[10px] font-semibold text-slate-400">
        Icon là danh mục · con số là số khoản chi trong ngày
      </p>
    </section>
  )
}
