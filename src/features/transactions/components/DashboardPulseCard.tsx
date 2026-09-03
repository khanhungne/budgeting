import { Activity, CalendarDays, ReceiptText, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import type { MonthlyBudget } from '../../budgets/types'
import { formatCompactCurrency, formatCurrency } from '../../../lib/format'
import { getCategory } from '../constants'
import { getDashboardInsights } from '../dashboardInsights'
import type { Category, Transaction } from '../types'

type DashboardPulseCardProps = {
  month: string
  transactions: Transaction[]
  expense: number
  budget: MonthlyBudget | null
  categories: Category[]
}

const getMood = (expense: number, budgetAmount: number, savingsRate: number | null) => {
  if (!expense) return { label: 'Ví đang yên ắng', emoji: '🌤️', tone: 'bg-sky-100 text-sky-800' }
  if (budgetAmount > 0 && expense > budgetAmount) {
    return { label: 'Hơi quá tay rồi', emoji: '😵‍💫', tone: 'bg-red-100 text-red-700' }
  }
  if (budgetAmount > 0 && expense / budgetAmount >= 0.8) {
    return { label: 'Sắp chạm vạch', emoji: '👀', tone: 'bg-amber-100 text-amber-800' }
  }
  if (savingsRate !== null && savingsRate >= 20) {
    return { label: 'Đang khá ổn áp', emoji: '✨', tone: 'bg-emerald-100 text-emerald-800' }
  }
  return { label: 'Đang đều tay', emoji: '🌱', tone: 'bg-lime-100 text-lime-800' }
}

export const DashboardPulseCard = ({
  month,
  transactions,
  expense,
  budget,
  categories,
}: DashboardPulseCardProps) => {
  const insights = useMemo(
    () => getDashboardInsights(transactions, month),
    [month, transactions],
  )
  const budgetAmount = Number(budget?.amount ?? 0)
  const mood = getMood(expense, budgetAmount, insights.savingsRate)
  const topCategory = insights.topCategory
    ? getCategory(insights.topCategory.id, categories)
    : null

  return (
    <section className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-[#eaf4ff] p-5 shadow-[0_8px_30px_rgba(45,91,120,0.08)]">
      <span className="pointer-events-none absolute -right-4 -top-8 size-24 rounded-full bg-[#ffd47e]/55" />
      <span className="pointer-events-none absolute right-14 top-3 size-3 rotate-12 rounded-sm bg-violet-400/60" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 -rotate-3 place-items-center rounded-2xl bg-sky-600 text-white shadow-[0_7px_18px_rgba(2,132,199,0.22)]">
            <Activity className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-sky-700">
              Nhịp tiền 7 ngày
            </p>
            <h2 className="mt-0.5 font-black text-slate-900">Tiền đi đâu thế nhỉ?</h2>
          </div>
        </div>
        <span className={`relative whitespace-nowrap rounded-full px-2.5 py-1.5 text-[10px] font-black ${mood.tone}`}>
          {mood.emoji} {mood.label}
        </span>
      </div>

      <div className="relative mt-6 flex h-32 items-end gap-2 rounded-[1.35rem] bg-white/70 px-3 pb-3 pt-5">
        {insights.dailySpending.map((item) => {
          const height = item.amount
            ? Math.max((item.amount / insights.maxDailySpending) * 100, 12)
            : 5
          return (
            <div key={item.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              {item.amount > 0 && (
                <span className="mb-1 max-w-full truncate text-[8px] font-black text-slate-400">
                  {formatCompactCurrency(item.amount)}
                </span>
              )}
              <div className="flex h-[76px] w-full items-end justify-center">
                <div
                  className={`w-full max-w-7 rounded-t-xl transition-all ${
                    item.isFocus
                      ? 'bg-[#ef9c66] shadow-[0_5px_12px_rgba(239,156,102,0.3)]'
                      : item.amount
                        ? 'bg-sky-400'
                        : 'bg-sky-100'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${item.date}: ${formatCurrency(item.amount)}`}
                />
              </div>
              <span className={`mt-1 text-[9px] font-black ${item.isFocus ? 'text-orange-600' : 'text-slate-400'}`}>
                {item.weekday}
              </span>
            </div>
          )
        })}
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-3">
        <article className="rounded-2xl bg-white/75 p-3.5">
          <div className="flex items-center gap-1.5 text-sky-700">
            <CalendarDays className="size-3.5" />
            <p className="text-[10px] font-black uppercase tracking-wide">{insights.focusLabel}</p>
          </div>
          <p className="mt-2 truncate text-sm font-black text-slate-900">
            {formatCurrency(insights.focusExpense)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">đã chi</p>
        </article>
        <article className="rounded-2xl bg-white/75 p-3.5">
          <div className="flex items-center gap-1.5 text-violet-700">
            <ReceiptText className="size-3.5" />
            <p className="text-[10px] font-black uppercase tracking-wide">Mỗi ngày</p>
          </div>
          <p className="mt-2 truncate text-sm font-black text-slate-900">
            {formatCurrency(insights.averageExpense)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">
            trung bình · {insights.transactionCount} giao dịch
          </p>
        </article>
      </div>

      {topCategory && insights.topCategory ? (
        <div className="relative mt-3 flex items-center gap-3 rounded-2xl bg-[#182f2a] p-3.5 text-white">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl text-xl"
            style={{ backgroundColor: `${topCategory.color}35` }}
          >
            {topCategory.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-emerald-100/60">Mê nhất tháng này</p>
            <p className="truncate text-sm font-black">{topCategory.label}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-[#ffd47e]">
              {Math.round(insights.topCategory.share)}%
            </p>
            <p className="text-[9px] text-emerald-100/50">tổng chi</p>
          </div>
        </div>
      ) : (
        <div className="relative mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-sky-200 bg-white/45 py-3 text-xs font-bold text-sky-700">
          <Sparkles className="size-4" /> Ghi một khoản để biểu đồ sống dậy nhé
        </div>
      )}
    </section>
  )
}
