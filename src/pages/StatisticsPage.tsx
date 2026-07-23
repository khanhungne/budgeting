import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  BarChart3,
  CalendarDays,
  PiggyBank,
  ReceiptText,
  X,
} from 'lucide-react'
import { CategoryBreakdown } from '../features/transactions/components/CategoryBreakdown'
import { getCategory } from '../features/transactions/constants'
import type { Transaction } from '../features/transactions/types'
import { formatMonth } from '../lib/dates'
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format'
import type {
  MonthlyTrend,
  TrendMonths,
} from '../features/transactions/hooks/useTransactionTrends'

type StatisticsPageProps = {
  month: string
  transactions: Transaction[]
  totals: { income: number; expense: number; balance: number }
  loading: boolean
  trends: MonthlyTrend[]
  trendsLoading: boolean
  trendMonths: TrendMonths
  onTrendMonthsChange: (months: TrendMonths) => void
  onMonthChange: (month: string) => void
}

export const StatisticsPage = ({
  month,
  transactions,
  totals,
  loading,
  trends,
  trendsLoading,
  trendMonths,
  onTrendMonthsChange,
  onMonthChange,
}: StatisticsPageProps) => {
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    setSelectedDate('')
  }, [month])

  const monthLimits = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    return {
      min: `${month}-01`,
      max: `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, '0')}`,
    }
  }, [month])

  const scopedTransactions = useMemo(
    () =>
      selectedDate
        ? transactions.filter((transaction) => transaction.occurred_on === selectedDate)
        : transactions,
    [selectedDate, transactions],
  )

  const scopedTotals = useMemo(() => {
    if (!selectedDate) return totals
    const result = scopedTransactions.reduce(
      (summary, transaction) => {
        summary[transaction.kind] += Number(transaction.amount)
        return summary
      },
      { income: 0, expense: 0 },
    )
    return { ...result, balance: result.income - result.expense }
  }, [scopedTransactions, selectedDate, totals])

  const insights = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    const now = new Date()
    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() + 1 === monthNumber
    const daysInMonth = new Date(year, monthNumber, 0).getDate()
    const elapsedDays = selectedDate ? 1 : isCurrentMonth ? now.getDate() : daysInMonth
    const expenses = scopedTransactions.filter((transaction) => transaction.kind === 'expense')
    const largest = [...expenses].sort(
      (first, second) => Number(second.amount) - Number(first.amount),
    )[0]
    const daily = Object.entries(
      expenses.reduce<Record<string, number>>((result, transaction) => {
        const day = transaction.occurred_on.slice(-2)
        result[day] = (result[day] ?? 0) + Number(transaction.amount)
        return result
      }, {}),
    ).sort(([first], [second]) => first.localeCompare(second))

    return {
      averagePerDay: elapsedDays ? scopedTotals.expense / elapsedDays : 0,
      largest,
      savingsRate: scopedTotals.income
        ? (scopedTotals.balance / scopedTotals.income) * 100
        : null,
      daily,
      maxDaily: Math.max(...daily.map(([, amount]) => amount), 1),
      expenseCount: expenses.length,
    }
  }, [month, scopedTotals, scopedTransactions, selectedDate])

  const maxTrendAmount = useMemo(
    () => Math.max(...trends.flatMap((item) => [item.income, item.expense]), 1),
    [trends],
  )

  if (loading) {
    return (
      <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-5 h-52 animate-pulse rounded-[1.75rem] bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
          Báo cáo
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Thống kê</h1>
            <p className="mt-1 text-sm capitalize text-slate-500">{formatMonth(month)}</p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(event) => event.target.value && onMonthChange(event.target.value)}
            aria-label="Chọn tháng"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-emerald-700"
          />
        </div>
      </header>

      <section className="mb-5 flex items-end gap-3 rounded-2xl bg-white p-3 shadow-[0_5px_20px_rgba(23,48,40,0.04)]">
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-[11px] font-bold text-slate-400">
            Thống kê một ngày
          </span>
          <input
            type="date"
            min={monthLimits.min}
            max={monthLimits.max}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:border-emerald-700"
          />
        </label>
        <button
          type="button"
          onClick={() => setSelectedDate('')}
          disabled={!selectedDate}
          className="flex h-11 items-center gap-1 rounded-xl bg-slate-100 px-3 text-[11px] font-black text-slate-600 disabled:opacity-40"
        >
          <X className="size-3.5" /> Cả tháng
        </button>
      </section>

      <section className="rounded-[1.75rem] bg-emerald-950 p-5 text-white shadow-[0_18px_40px_rgba(17,63,54,0.18)]">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200/70">
          {selectedDate ? `Ngày ${formatDate(selectedDate)}` : 'Tỷ lệ tiết kiệm'}
        </p>
        <div className="mt-2 flex items-end justify-between">
          <p
            className={`text-3xl font-black ${
              insights.savingsRate === null || insights.savingsRate >= 0
                ? 'text-emerald-300'
                : 'text-red-300'
            }`}
          >
            {insights.savingsRate === null ? '—' : `${Math.round(insights.savingsRate)}%`}
          </p>
          <p className="text-right text-xs leading-5 text-emerald-100/70">
            Số dư
            <br />
            <span className="font-black text-white">{formatCurrency(scopedTotals.balance)}</span>
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[11px] text-emerald-100/70">Tổng thu</p>
            <p className="mt-1 truncate text-sm font-black">{formatCurrency(scopedTotals.income)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[11px] text-emerald-100/70">Tổng chi</p>
            <p className="mt-1 truncate text-sm font-black">{formatCurrency(scopedTotals.expense)}</p>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <article className="rounded-2xl bg-white p-4">
          <CalendarDays className="size-5 text-sky-600" />
          <p className="mt-3 truncate text-base font-black text-slate-900">
            {formatCompactCurrency(insights.averagePerDay)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Chi trung bình/ngày</p>
        </article>
        <article className="rounded-2xl bg-white p-4">
          <ReceiptText className="size-5 text-violet-600" />
          <p className="mt-3 text-base font-black text-slate-900">{insights.expenseCount}</p>
          <p className="mt-1 text-xs text-slate-400">Khoản chi trong tháng</p>
        </article>
      </div>

      <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-violet-50">
              <BarChart3 className="size-5 text-violet-700" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-700">
                Xu hướng
              </p>
              <h2 className="font-black text-slate-900">Thu và chi nhiều tháng</h2>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
          {([3, 6, 12] as TrendMonths[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => onTrendMonthsChange(range)}
              className={`rounded-xl py-2 text-xs font-black transition ${
                trendMonths === range
                  ? 'bg-white text-violet-800 shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              {range} tháng
            </button>
          ))}
        </div>
        {trendsLoading ? (
          <div className="mt-5 h-48 animate-pulse rounded-2xl bg-slate-100" />
        ) : (
          <>
            <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-emerald-500" /> Thu
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-orange-400" /> Chi
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {trends.map((item) => (
                <div key={item.month} className="grid grid-cols-[3rem_1fr] items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400">
                    {item.month.slice(5)}/{item.month.slice(2, 4)}
                  </span>
                  <div className="space-y-1">
                    <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.max((item.income / maxTrendAmount) * 100, item.income ? 2 : 0)}%`,
                        }}
                        title={`Thu ${formatCurrency(item.income)}`}
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-orange-50">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{
                          width: `${Math.max((item.expense / maxTrendAmount) * 100, item.expense ? 2 : 0)}%`,
                        }}
                        title={`Chi ${formatCurrency(item.expense)}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50">
            <PiggyBank className="size-5 text-emerald-700" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
              Cơ cấu
            </p>
            <h2 className="font-black text-slate-900">Chi theo danh mục</h2>
          </div>
        </div>
        <CategoryBreakdown transactions={scopedTransactions} />
      </section>

      <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-700">
            Nhịp chi tiêu
          </p>
          <h2 className="mt-1 font-black text-slate-900">Theo ngày có phát sinh</h2>
        </div>
        {insights.daily.length ? (
          <div className="flex h-40 items-end gap-2 overflow-x-auto pb-1">
            {insights.daily.map(([day, amount]) => (
              <div key={day} className="flex h-full min-w-10 flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-[9px] font-bold text-slate-400">
                  {formatCompactCurrency(amount)}
                </span>
                <div
                  className="w-full min-w-7 rounded-t-lg bg-sky-400"
                  style={{
                    height: `${Math.max((amount / insights.maxDaily) * 100, 8)}%`,
                  }}
                  title={`${day}/${month.slice(5)}: ${formatCurrency(amount)}`}
                />
                <span className="mt-1.5 text-[10px] font-bold text-slate-400">{day}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">Chưa có khoản chi để vẽ biểu đồ.</p>
        )}
      </section>

      {insights.largest && (
        <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-red-50">
              <ArrowDownRight className="size-5 text-red-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">Khoản chi lớn nhất</p>
              <p className="truncate font-black text-slate-900">
                {insights.largest.note || getCategory(insights.largest.category).label}
              </p>
            </div>
            <p className="text-sm font-black text-red-600">
              {formatCurrency(Number(insights.largest.amount))}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
