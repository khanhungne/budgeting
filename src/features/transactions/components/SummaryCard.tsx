import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { formatCurrency } from '../../../lib/format'
import { MonthSwitcher } from './MonthSwitcher'

type SummaryCardProps = {
  month: string
  income: number
  expense: number
  monthlyBalance: number
  totalBalance: number
  balanceLoading: boolean
  onMonthChange: (month: string) => void
}

export const SummaryCard = ({
  month,
  income,
  expense,
  monthlyBalance,
  totalBalance,
  balanceLoading,
  onMonthChange,
}: SummaryCardProps) => {
  const isGrowing = monthlyBalance >= 0
  const TrendIcon = isGrowing ? TrendingUp : TrendingDown

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#123d34] p-5 text-white shadow-[0_22px_50px_rgba(17,63,54,0.24)]">
      <span className="pointer-events-none absolute -right-4 -top-12 size-36 rounded-full bg-[#f5bd58]" />
      <span className="pointer-events-none absolute right-20 top-20 size-4 rotate-12 rounded-sm bg-[#ee8f68]" />
      <span className="pointer-events-none absolute right-6 top-28 size-2.5 rounded-full bg-sky-300" />

      <div className="relative rounded-2xl bg-black/10 px-1 py-0.5">
        <MonthSwitcher month={month} onChange={onMonthChange} />
      </div>

      <div className="relative my-6 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-emerald-100/70">
            <Wallet className="size-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">
              Ví của mình đang có
            </span>
          </div>
          <p
            className="truncate text-[2rem] font-black tracking-tight"
            aria-busy={balanceLoading}
          >
            {balanceLoading ? 'Đang tính…' : formatCurrency(totalBalance)}
          </p>
        </div>
        <span className="grid size-14 shrink-0 rotate-6 place-items-center rounded-[1.25rem] bg-[#ffd477] text-3xl shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
          🐷
        </span>
      </div>

      <div className={`relative mb-3 flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 ${isGrowing ? 'bg-emerald-300/12' : 'bg-orange-300/12'}`}>
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-100/70">
          <TrendIcon className={`size-4 ${isGrowing ? 'text-emerald-300' : 'text-orange-300'}`} />
          {isGrowing ? 'Ví lớn thêm trong tháng' : 'Ví nhỏ đi trong tháng'}
        </span>
        <span className={`whitespace-nowrap text-sm font-extrabold ${isGrowing ? 'text-emerald-200' : 'text-orange-200'}`}>
          {isGrowing ? '+' : '−'}{formatCurrency(Math.abs(monthlyBalance))}
        </span>
      </div>

      <div className="relative grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-emerald-100/70">
            <span className="grid size-7 place-items-center rounded-full bg-emerald-300/15">
              <ArrowDownLeft className="size-4 text-emerald-200" />
            </span>
            <span className="text-xs font-semibold">Tiền ghé vào</span>
          </div>
          <p className="truncate text-sm font-extrabold">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-emerald-100/70">
            <span className="grid size-7 place-items-center rounded-full bg-orange-300/15">
              <ArrowUpRight className="size-4 text-orange-200" />
            </span>
            <span className="text-xs font-semibold">Tiền chạy ra</span>
          </div>
          <p className="truncate text-sm font-extrabold">{formatCurrency(expense)}</p>
        </div>
      </div>
    </section>
  )
}
