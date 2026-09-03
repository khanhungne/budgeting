import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../../lib/format'
import { MonthSwitcher } from './MonthSwitcher'

type SummaryCardProps = {
  month: string
  income: number
  expense: number
  monthlyBalance: number
  onMonthChange: (month: string) => void
}

export const SummaryCard = ({
  month,
  income,
  expense,
  monthlyBalance,
  onMonthChange,
}: SummaryCardProps) => {
  const isPositive = monthlyBalance >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <section className="rounded-[1.75rem] bg-white p-4 shadow-[0_8px_26px_rgba(23,48,40,0.05)]">
      <div className="rounded-2xl bg-slate-50 px-1 py-0.5">
        <MonthSwitcher month={month} onChange={onMonthChange} />
      </div>

      <div className="px-1 pb-4 pt-5">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
          <TrendIcon className={`size-4 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`} />
          Chênh lệch thu chi
        </p>
        <p
          className={`mt-1.5 truncate text-3xl font-black tracking-tight ${
            isPositive ? 'text-emerald-800' : 'text-red-600'
          }`}
        >
          {isPositive ? '+' : '−'}{formatCurrency(Math.abs(monthlyBalance))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-emerald-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <ArrowDownLeft className="size-4" /> Tổng thu
          </p>
          <p className="mt-2 truncate text-sm font-black text-slate-800">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-red-600">
            <ArrowUpRight className="size-4" /> Tổng chi
          </p>
          <p className="mt-2 truncate text-sm font-black text-slate-800">
            {formatCurrency(expense)}
          </p>
        </div>
      </div>
    </section>
  )
}
