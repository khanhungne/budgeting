import { ArrowDownLeft, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, WalletCards } from 'lucide-react'
import { formatMonth, shiftMonth } from '../../../lib/dates'
import { formatCompactCurrency, formatCurrency } from '../../../lib/format'

type CurrentBalanceCardProps = {
  totalBalance: number
  loading: boolean
  walletCount: number
  month: string
  income: number
  expense: number
  monthlyBalance: number
  onMonthChange: (month: string) => void
  onViewDetails: () => void
}

export const CurrentBalanceCard = ({
  totalBalance,
  loading,
  walletCount,
  month,
  income,
  expense,
  monthlyBalance,
  onMonthChange,
  onViewDetails,
}: CurrentBalanceCardProps) => (
  <section className="relative overflow-hidden rounded-[1.8rem] bg-[#123d34] p-4 text-white shadow-[0_18px_38px_rgba(17,63,54,0.18)]">
    <button
      type="button"
      onClick={onViewDetails}
      className="relative flex w-full items-center justify-between gap-2 p-1 text-left active:scale-[0.99]"
      aria-label="Xem chi tiết các ví và tài khoản"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200/75">
          <WalletCards className="size-3.5" /> Tổng số dư hiện có
        </span>
        <span
          className={`mt-2 block truncate text-[1.85rem] font-black tracking-tight ${
            totalBalance < 0 ? 'text-orange-200' : 'text-white'
          }`}
          aria-busy={loading}
        >
          {loading ? 'Đang tính…' : formatCurrency(totalBalance)}
        </span>
        <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-100/55">
          {walletCount} ví · Xem chi tiết <ArrowRight className="size-3" />
        </span>
      </span>

      <span
        className={`dashboard-prosperity-tree ${
          totalBalance < 0 ? 'dashboard-prosperity-tree--muted' : ''
        }`}
        aria-hidden="true"
      >
        <img
          src="/assets/money-tree-3d.webp"
          alt=""
          width="512"
          height="512"
          decoding="async"
          fetchPriority="high"
          draggable={false}
        />
      </span>
    </button>

    <div className="relative mt-4 rounded-[1.25rem] bg-white/8 p-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/8 text-emerald-100"
          aria-label="Tháng trước"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-xs font-black capitalize text-white">{formatMonth(month)}</p>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/8 text-emerald-100"
          aria-label="Tháng sau"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-white/10">
        <div className="min-w-0 px-2">
          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-200/70">
            <ArrowDownLeft className="size-3" /> Thu
          </span>
          <p className="mt-1 truncate text-xs font-black">{formatCompactCurrency(income)}</p>
        </div>
        <div className="min-w-0 px-2">
          <span className="flex items-center gap-1 text-[9px] font-bold text-orange-200/80">
            <ArrowUpRight className="size-3" /> Chi
          </span>
          <p className="mt-1 truncate text-xs font-black">{formatCompactCurrency(expense)}</p>
        </div>
        <div className="min-w-0 px-2">
          <span className="text-[9px] font-bold text-emerald-100/55">
            {monthlyBalance < 0 ? 'Âm' : 'Còn lại'}
          </span>
          <p className={`mt-1 truncate text-xs font-black ${monthlyBalance < 0 ? 'text-orange-200' : ''}`}>
            {formatCompactCurrency(Math.abs(monthlyBalance))}
          </p>
        </div>
      </div>
    </div>
  </section>
)
