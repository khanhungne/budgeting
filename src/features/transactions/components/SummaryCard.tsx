import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import { formatCurrency } from '../../../lib/format'
import { MonthSwitcher } from './MonthSwitcher'

type SummaryCardProps = {
  month: string
  income: number
  expense: number
  balance: number
  onMonthChange: (month: string) => void
}

export const SummaryCard = ({
  month,
  income,
  expense,
  balance,
  onMonthChange,
}: SummaryCardProps) => (
  <section className="overflow-hidden rounded-[2rem] bg-emerald-950 p-5 text-white shadow-[0_22px_50px_rgba(17,63,54,0.24)]">
    <MonthSwitcher month={month} onChange={onMonthChange} />

    <div className="my-6">
      <div className="mb-2 flex items-center gap-2 text-emerald-100/70">
        <Wallet className="size-4" />
        <span className="text-xs font-bold uppercase tracking-[0.15em]">Số dư tháng</span>
      </div>
      <p className="truncate text-[2rem] font-black tracking-tight">{formatCurrency(balance)}</p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-white/10 p-3.5">
        <div className="mb-2 flex items-center gap-2 text-emerald-100/70">
          <span className="grid size-7 place-items-center rounded-full bg-emerald-300/15">
            <ArrowDownLeft className="size-4 text-emerald-200" />
          </span>
          <span className="text-xs font-semibold">Tiền vào</span>
        </div>
        <p className="truncate text-sm font-extrabold">{formatCurrency(income)}</p>
      </div>
      <div className="rounded-2xl bg-white/10 p-3.5">
        <div className="mb-2 flex items-center gap-2 text-emerald-100/70">
          <span className="grid size-7 place-items-center rounded-full bg-orange-300/15">
            <ArrowUpRight className="size-4 text-orange-200" />
          </span>
          <span className="text-xs font-semibold">Tiền ra</span>
        </div>
        <p className="truncate text-sm font-extrabold">{formatCurrency(expense)}</p>
      </div>
    </div>
  </section>
)
