import { ArrowRight, WifiOff } from 'lucide-react'
import { BudgetCard } from '../features/budgets/components/BudgetCard'
import type { MonthlyBudget } from '../features/budgets/types'
import { CategoryBreakdown } from '../features/transactions/components/CategoryBreakdown'
import { SummaryCard } from '../features/transactions/components/SummaryCard'
import { TransactionList } from '../features/transactions/components/TransactionList'
import type { Transaction } from '../features/transactions/types'
import type { Wallet } from '../features/wallets/types'
import { getInitials } from '../lib/format'

type DashboardPageProps = {
  user: { email?: string }
  demoMode?: boolean
  month: string
  transactions: Transaction[]
  wallets: Wallet[]
  loading: boolean
  totals: { income: number; expense: number; balance: number }
  budget: MonthlyBudget | null
  budgetLoading: boolean
  budgetSaving: boolean
  error: string | null
  onMonthChange: (month: string) => void
  onBudgetSave: (amount: number) => Promise<void>
  onViewAll: () => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

export const DashboardPage = ({
  user,
  demoMode = false,
  month,
  transactions,
  wallets,
  loading,
  totals,
  budget,
  budgetLoading,
  budgetSaving,
  error,
  onMonthChange,
  onBudgetSave,
  onViewAll,
  onEdit,
  onDelete,
}: DashboardPageProps) => {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-400">{greeting},</p>
            {demoMode && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                Demo local
              </span>
            )}
          </div>
          <h1 className="mt-0.5 text-xl font-black text-slate-900">Hôm nay mình ổn chứ?</h1>
        </div>
        <span className="grid size-11 place-items-center rounded-2xl bg-[#dcebdc] text-sm font-black text-emerald-900">
          {getInitials(user.email)}
        </span>
      </header>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <WifiOff className="size-4 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      <SummaryCard
        month={month}
        {...totals}
        onMonthChange={onMonthChange}
      />

      <BudgetCard
        budget={budget}
        expense={totals.expense}
        loading={budgetLoading}
        saving={budgetSaving}
        onSave={onBudgetSave}
      />

      <section className="mt-7 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              Phân bổ
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Chi theo danh mục</h2>
          </div>
        </div>
        <CategoryBreakdown transactions={transactions} />
      </section>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              Gần đây
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Giao dịch mới</h2>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-bold text-emerald-800"
          >
            Xem tất cả <ArrowRight className="size-3.5" />
          </button>
        </div>
        <TransactionList
          transactions={transactions}
          wallets={wallets}
          loading={loading}
          limit={5}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </section>
    </div>
  )
}
