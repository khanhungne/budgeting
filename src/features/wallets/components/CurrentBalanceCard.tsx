import { ArrowRight, WalletCards } from 'lucide-react'
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
  <section>
    <button
      type="button"
      onClick={onViewDetails}
      className="relative w-full overflow-hidden rounded-[1.8rem] bg-[#123d34] p-5 text-left text-white shadow-[0_18px_38px_rgba(17,63,54,0.18)] transition active:scale-[0.99]"
      aria-label="Xem chi tiết các ví và tài khoản"
    >
      <span className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full bg-emerald-300/10" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-200/75">
            <WalletCards className="size-4" /> Số dư hiện tại
          </p>
          <p
            className={`mt-2 truncate text-[2rem] font-black tracking-tight ${
              totalBalance < 0 ? 'text-orange-200' : 'text-white'
            }`}
            aria-busy={loading}
          >
            {loading ? 'Đang tính…' : formatCurrency(totalBalance)}
          </p>
          <p className="mt-1 text-xs text-emerald-100/55">
            Tổng tiền thực tế trong {walletCount} ví
          </p>
        </div>

        <div
          className={`dashboard-money-scene shrink-0 scale-[0.82] ${
            totalBalance < 0 ? 'dashboard-money-scene--negative' : ''
          }`}
          aria-hidden="true"
        >
          <span className="dashboard-money-coin dashboard-money-coin--back">₫</span>
          <span className="dashboard-money-coin dashboard-money-coin--front">₫</span>
          <span className="dashboard-wallet-3d">
            <i className="dashboard-wallet-3d__shine" />
            <b>₫</b>
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-bold text-emerald-100/65">
        <span>Không đổi khi chuyển tháng</span>
        <span className="flex items-center gap-1 text-white">
          Xem các ví <ArrowRight className="size-3.5" />
        </span>
      </div>
    </button>
  </section>
)
