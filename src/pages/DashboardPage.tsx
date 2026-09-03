import { ArrowRight, PieChart, Sparkles, WifiOff } from 'lucide-react'
import { BudgetCard } from '../features/budgets/components/BudgetCard'
import { CategoryBudgetCard } from '../features/budgets/components/CategoryBudgetCard'
import type { CategoryBudget } from '../features/budgets/categoryTypes'
import type { MonthlyBudget } from '../features/budgets/types'
import { CategoryBreakdown } from '../features/transactions/components/CategoryBreakdown'
import { SummaryCard } from '../features/transactions/components/SummaryCard'
import { TransactionList } from '../features/transactions/components/TransactionList'
import type { Category, Transaction } from '../features/transactions/types'
import { CurrentBalanceCard } from '../features/wallets/components/CurrentBalanceCard'
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
  totalWalletBalance: number
  walletBalanceLoading: boolean
  budget: MonthlyBudget | null
  budgetLoading: boolean
  budgetSaving: boolean
  error: string | null
  onMonthChange: (month: string) => void
  onBudgetSave: (amount: number) => Promise<void>
  categoryBudgets: CategoryBudget[]
  categoryBudgetsLoading: boolean
  categoryBudgetsSaving: boolean
  categoryBudgetsError: string | null
  onCategoryBudgetSave: (category: string, amount: number) => Promise<void>
  onCategoryBudgetRemove: (id: string) => Promise<void>
  customCategories: Category[]
  onViewAll: () => void
  onViewAssets: () => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  onViewReceipt: (transaction: Transaction) => Promise<string | null>
}

export const DashboardPage = ({
  user,
  demoMode = false,
  month,
  transactions,
  wallets,
  loading,
  totals,
  totalWalletBalance,
  walletBalanceLoading,
  budget,
  budgetLoading,
  budgetSaving,
  error,
  onMonthChange,
  onBudgetSave,
  categoryBudgets,
  categoryBudgetsLoading,
  categoryBudgetsSaving,
  categoryBudgetsError,
  onCategoryBudgetSave,
  onCategoryBudgetRemove,
  customCategories,
  onViewAll,
  onViewAssets,
  onEdit,
  onDelete,
  onViewReceipt,
}: DashboardPageProps) => {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const todayLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return (
    <div className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-5">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-400">{greeting},</p>
            {demoMode && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800">
                Demo local
              </span>
            )}
          </div>
          <h1 className="mt-0.5 truncate text-xl font-black text-slate-900">Tiền nong sao rồi ta?</h1>
          <p className="mt-1 text-[11px] font-bold capitalize text-emerald-700/65">{todayLabel}</p>
        </div>
        <div className="relative shrink-0">
          <span className="grid size-12 rotate-3 place-items-center rounded-[1.15rem] bg-[#dcebdc] text-sm font-black text-emerald-900 shadow-[0_6px_16px_rgba(26,72,59,0.1)]">
            {getInitials(user.email)}
          </span>
          <span className="absolute -bottom-1 -left-1 grid size-5 -rotate-6 place-items-center rounded-full border-2 border-[#f5f7f2] bg-[#ffd477] text-[10px]">👋</span>
        </div>
      </header>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <WifiOff className="size-4 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      <SummaryCard
        month={month}
        income={totals.income}
        expense={totals.expense}
        monthlyBalance={totals.balance}
        onMonthChange={onMonthChange}
      />

      <CurrentBalanceCard
        totalBalance={totalWalletBalance}
        loading={walletBalanceLoading}
        walletCount={wallets.length}
        onViewDetails={onViewAssets}
      />

      <BudgetCard
        budget={budget}
        expense={totals.expense}
        loading={budgetLoading}
        saving={budgetSaving}
        onSave={onBudgetSave}
      />

      <section className="relative mt-5 overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
        <span className="pointer-events-none absolute -right-4 -top-8 size-24 rounded-full bg-violet-100/65" />
        <div className="mb-5 flex items-center justify-between">
          <div className="relative flex items-center gap-3">
            <span className="grid size-10 -rotate-3 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <PieChart className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-700">
                Bản đồ chi tiêu
              </p>
              <h2 className="mt-0.5 text-lg font-black text-slate-900">Miếng nào to nhất?</h2>
            </div>
          </div>
        </div>
        <CategoryBreakdown transactions={transactions} categories={customCategories} />
      </section>

      <CategoryBudgetCard
        budgets={categoryBudgets}
        transactions={transactions}
        loading={categoryBudgetsLoading}
        saving={categoryBudgetsSaving}
        error={categoryBudgetsError}
        onSave={onCategoryBudgetSave}
        onRemove={(id) => onCategoryBudgetRemove(id).catch(() => undefined)}
        customCategories={customCategories}
      />

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
              <Sparkles className="size-3.5" /> Vừa mới diễn ra
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Nhật ký của ví</h2>
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
          onViewReceipt={onViewReceipt}
          categories={customCategories}
        />
      </section>
    </div>
  )
}
