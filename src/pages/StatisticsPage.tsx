import { ArrowDownLeft, ArrowUpRight, CalendarDays, Scale, Sparkles } from 'lucide-react'
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
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-5 h-36 animate-pulse rounded-[1.5rem] bg-slate-100" />
        <div className="mt-4 h-96 animate-pulse rounded-[1.5rem] bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="cashflow-page px-4 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-5">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#35775d]">
            <Sparkles className="size-3" /> Nhật ký tài khí
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            Lịch dòng tiền
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Thu chi sáng rõ, tiền bạc có nhịp.
          </p>
        </div>

        <span className="wealth-seal" aria-label="Tụ tài">
          <b>₫</b>
          <i>TỤ TÀI</i>
        </span>
      </header>

      <section className="cashflow-month-panel mb-4 overflow-hidden rounded-[1.4rem] bg-[#153f35] p-4 text-white shadow-[0_14px_32px_rgba(21,63,53,0.18)]">
        <div className="relative z-10">
          <MonthSwitcher month={month} onChange={onMonthChange} variant="dark" />

          <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-3">
            <div className="min-w-0 pr-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-[#95d7ad]">
                Dương · Thu
              </p>
              <p className="mt-1 truncate text-xs font-black text-white">
                {formatCompactCurrency(totals.income)}
              </p>
            </div>
            <div className="min-w-0 px-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-[#ffb18a]">
                Âm · Chi
              </p>
              <p className="mt-1 truncate text-xs font-black text-white">
                {formatCompactCurrency(totals.expense)}
              </p>
            </div>
            <div className="min-w-0 pl-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-[#e7c36c]">
                Thế cân bằng
              </p>
              <p
                className={`mt-1 truncate text-xs font-black ${
                  totals.balance < 0 ? 'text-[#ffb18a]' : 'text-[#ffe09a]'
                }`}
              >
                {formatCompactCurrency(totals.balance)}
              </p>
            </div>
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

      <section
        id="daily-cashbook"
        aria-live="polite"
        className="mt-4 overflow-hidden rounded-[1.5rem] border border-[#e8e1d2] bg-white shadow-[0_8px_26px_rgba(23,48,40,0.05)]"
      >
        <div className="border-b border-[#eee8dc] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 -rotate-2 place-items-center rounded-lg border border-[#b8d9cf] bg-[#edf7f2] text-[#286c58] shadow-[3px_3px_0_#cfe3d8]">
                <CalendarDays className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9b7a34]">
                  Sổ tiền trong ngày
                </p>
                <h2 className="mt-0.5 truncate text-base font-black text-slate-900">
                  {formatDate(selectedDate)}
                </h2>
              </div>
            </div>
            <span className="shrink-0 rounded-md border border-slate-200 bg-[#f8f8f3] px-2.5 py-1 text-[10px] font-black text-slate-500">
              {selectedTransactions.length} khoản
            </span>
          </div>

          {selectedTransactions.length > 0 && (
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-lg border border-slate-100 bg-[#fafaf6]">
              <div className="min-w-0 px-3 py-2.5">
                <p className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700">
                  <ArrowDownLeft className="size-3" /> Dương · Thu
                </p>
                <p className="mt-1 truncate text-xs font-black text-emerald-800">
                  {formatCurrency(selectedTotals.income)}
                </p>
              </div>
              <span className="grid w-8 place-items-center border-x border-slate-100 bg-white text-[#b18b3d]">
                <Scale className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 px-3 py-2.5 text-right">
                <p className="flex items-center justify-end gap-1 text-[9px] font-black uppercase text-[#bf5b3d]">
                  Âm · Chi <ArrowUpRight className="size-3" />
                </p>
                <p className="mt-1 truncate text-xs font-black text-[#a84e34]">
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
                  className={`flex items-center gap-3 border-l-[3px] px-4 py-3.5 ${
                    index ? 'border-t border-t-slate-100' : ''
                  }`}
                  style={{ borderLeftColor: category.color }}
                >
                  <span
                    className="grid size-10 shrink-0 -rotate-1 place-items-center rounded-lg border border-white text-xl shadow-[2px_2px_0_rgba(30,50,42,0.08)]"
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
                      income ? 'text-emerald-700' : 'text-[#bd5639]'
                    }`}
                  >
                    {income ? '+' : '−'}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="px-6 py-9 text-center">
            <span className="mx-auto grid size-12 -rotate-2 place-items-center rounded-lg border border-emerald-100 bg-emerald-50 text-2xl shadow-[3px_3px_0_#d7ebdf]">
              🍃
            </span>
            <p className="mt-3 text-sm font-black text-slate-700">Ngày tĩnh, chưa có dòng tiền</p>
            <p className="mt-1 text-xs text-slate-400">
              Chọn ngày có dấu màu để mở chi tiết.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
