import { ArrowRight, CalendarClock, WalletCards } from 'lucide-react'
import { formatCurrency } from '../../../lib/format'

type CurrentBalanceCardProps = {
  totalBalance: number
  loading: boolean
  walletCount: number
  onViewDetails: () => void
}

export const CurrentBalanceCard = ({
  totalBalance,
  loading,
  walletCount,
  onViewDetails,
}: CurrentBalanceCardProps) => (
  <section className="mt-5">
    <button
      type="button"
      onClick={onViewDetails}
      className="relative w-full overflow-hidden rounded-[1.75rem] bg-[#fff3d9] p-5 text-left shadow-[0_8px_30px_rgba(101,74,25,0.08)] transition active:scale-[0.99]"
      aria-label="Xem chi tiết các ví và tài khoản"
    >
      <span className="pointer-events-none absolute -right-4 -top-10 size-28 rounded-full bg-[#f6bf5c]/55" />
      <span className="pointer-events-none absolute right-20 top-4 size-3 rotate-12 rounded-sm bg-violet-400/65" />

      <div className="relative flex items-start gap-3">
        <span className="grid size-11 shrink-0 -rotate-3 place-items-center rounded-2xl bg-amber-400 text-amber-950 shadow-[0_7px_16px_rgba(180,123,23,0.2)]">
          <WalletCards className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-800">
            Bức tranh lớn
          </p>
          <h2 className="mt-0.5 text-sm font-black text-amber-950/70">Tổng tiền hiện có</h2>
          <p
            className={`mt-1 truncate text-2xl font-black tracking-tight ${
              totalBalance < 0 ? 'text-red-700' : 'text-slate-900'
            }`}
            aria-busy={loading}
          >
            {loading ? 'Đang tính…' : formatCurrency(totalBalance)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-amber-950/50">
            Tổng tiền thực tế trong {walletCount} ví và tài khoản
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-3.5 py-3">
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-amber-900/60">
          <CalendarClock className="size-3.5" /> Không đổi theo tháng
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap text-[11px] font-black text-amber-900">
          Xem các ví <ArrowRight className="size-3.5" />
        </span>
      </div>
    </button>
  </section>
)
