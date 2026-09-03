import { ArrowDownLeft, ArrowUpRight, CalendarDays, ReceiptText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { suggestedCalendarDate } from '../features/transactions/calendar'
import { MonthSwitcher } from '../features/transactions/components/MonthSwitcher'
import { TransactionCalendar } from '../features/transactions/components/TransactionCalendar'
import { getCategory } from '../features/transactions/constants'
import type { Category, Transaction } from '../features/transactions/types'
import { currentDate } from '../lib/dates'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format'

type StatisticsPageProps = {
  month: string
  transactions: Transaction[]
  totals: { income: number; expense: number; balance: number }
  loading: boolean
  onMonthChange: (month: string) => void
  categories: Category[]
}

export const StatisticsPage = ({
  month,
  transactions,
  totals,
  loading,
  onMonthChange,
  categories,
}: StatisticsPageProps) => {
  const [manualSelection, setManualSelection] = useState<{
    month: string
    date: string
  } | null>(null)

  const suggestedDate = useMemo(
    () => suggestedCalendarDate(month, transactions, currentDate()),
    [month, transactions],
  )
  const selectedDate =
    manualSelection?.month === month ? manualSelection.date : suggestedDate
  const selectedTransactions = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.occurred_on === selectedDate)
        .sort((first, second) => second.created_at.localeCompare(first.created_at)),
    [selectedDate, transactions],
  )
  const selectedTotals = useMemo(
    () =>
      selectedTransactions.reduce(
        (result, transaction) => {
          result[transaction.kind] += Number(transaction.amount)
          return result
        },
        { income: 0, expense: 0 },
      ),
    [selectedTransactions],
  )

  if (loading) {
    return (
      <div className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-5">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-5 h-24 animate-pulse rounded-[1.75rem] bg-slate-100" />
        <div className="mt-4 h-80 animate-pulse rounded-[1.75rem] bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-5">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
            Nhật ký theo ngày
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            Lịch chi tiêu
          </h1>
          <p className="mt-1 text-xs text-slate-400">Chạm vào một ngày để mở sổ.</p>
        </div>
        <span className="grid size-11 rotate-3 place-items-center rounded-2xl bg-amber-100 text-2xl shadow-sm">
          🗓️
        </span>
      </header>

      <section className="mb-4 rounded-[1.5rem] bg-white p-3 shadow-[0_6px_22px_rgba(23,48,40,0.04)]">
        <div className="rounded-2xl bg-slate-50 px-1 py-0.5">
          <MonthSwitcher month={month} onChange={onMonthChange} />
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100">
          <div className="min-w-0 px-2">
            <p className="text-[9px] font-black uppercase text-emerald-600">Tổng thu</p>
            <p className="mt-1 truncate text-xs font-black text-slate-800">
              {formatCompactCurrency(totals.income)}
            </p>
          </div>
          <div className="min-w-0 px-2">
            <p className="text-[9px] font-black uppercase text-red-500">Tổng chi</p>
            <p className="mt-1 truncate text-xs font-black text-slate-800">
              {formatCompactCurrency(totals.expense)}
            </p>
          </div>
          <div className="min-w-0 px-2">
            <p className="text-[9px] font-black uppercase text-slate-400">Chênh lệch</p>
            <p
              className={`mt-1 truncate text-xs font-black ${
                totals.balance < 0 ? 'text-red-600' : 'text-emerald-800'
              }`}
            >
              {formatCompactCurrency(totals.balance)}
            </p>
          </div>
        </div>
      </section>

      <TransactionCalendar
        month={month}
        transactions={transactions}
        categories={categories}
        selectedDate={selectedDate}
        onSelectDate={(date) => setManualSelection({ month, date })}
      />

      <section className="mt-4 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_8px_26px_rgba(23,48,40,0.05)]">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-700">
                <CalendarDays className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Sổ trong ngày
                </p>
                <h2 className="mt-0.5 truncate text-base font-black text-slate-900">
                  {formatDate(selectedDate)}
                </h2>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
              {selectedTransactions.length} khoản
            </span>
          </div>

          {selectedTransactions.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 px-3 py-2">
                <p className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600">
                  <ArrowDownLeft className="size-3" /> Thu vào
                </p>
                <p className="mt-1 truncate text-xs font-black text-emerald-800">
                  {formatCurrency(selectedTotals.income)}
                </p>
              </div>
              <div className="rounded-xl bg-red-50 px-3 py-2">
                <p className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500">
                  <ArrowUpRight className="size-3" /> Chi ra
                </p>
                <p className="mt-1 truncate text-xs font-black text-red-700">
                  {formatCurrency(selectedTotals.expense)}
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedTransactions.length > 0 ? (
          <div>
            {selectedTransactions.map((transaction, index) => {
              const category = getCategory(transaction.category, categories)
              const income = transaction.kind === 'income'
              return (
                <article
                  key={transaction.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    index ? 'border-t border-slate-100' : ''
                  }`}
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-2xl text-xl"
                    style={{ backgroundColor: `${category.color}18` }}
                  >
                    {category.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-800">
                      {transaction.note || category.label}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                      {category.label} · {income ? 'Khoản thu' : 'Khoản chi'}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-xs font-black ${
                      income ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {income ? '+' : '−'}{formatCurrency(Number(transaction.amount))}
                  </p>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="px-6 py-9 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">
              🍃
            </span>
            <p className="mt-3 text-sm font-black text-slate-700">Ngày này chưa có giao dịch</p>
            <p className="mt-1 text-xs text-slate-400">Chọn một ngày có icon để xem chi tiết.</p>
          </div>
        )}
      </section>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[11px] font-semibold leading-5 text-amber-900/70">
        <ReceiptText className="size-4 shrink-0" />
        Ngày có nhiều khoản chi sẽ hiện số ngay trong ô lịch.
      </div>
    </div>
  )
}
