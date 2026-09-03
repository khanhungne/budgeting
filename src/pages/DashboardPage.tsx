import { ArrowRight, WifiOff } from 'lucide-react'
import type { CategoryBudget } from '../features/budgets/categoryTypes'
import { SpendingPlanCard } from '../features/budgets/components/SpendingPlanCard'
import type { MonthlyBudget } from '../features/budgets/types'
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
  onBudgetRemove: () => Promise<void>
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
  onBudgetRemove,
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
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Tổng quan</h1>
            {demoMode && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-800">
                Demo
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs font-semibold capitalize text-slate-400">
            {greeting} · {todayLabel}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-900">
          {getInitials(user.email)}
        </span>
      </header>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <WifiOff className="size-4 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      <CurrentBalanceCard
        totalBalance={totalWalletBalance}
        loading={walletBalanceLoading}
        walletCount={wallets.length}
        month={month}
        income={totals.income}
        expense={totals.expense}
        monthlyBalance={totals.balance}
        onMonthChange={onMonthChange}
        onViewDetails={onViewAssets}
      />

      <SpendingPlanCard
        budget={budget}
        expense={totals.expense}
        budgetLoading={budgetLoading}
        budgetSaving={budgetSaving}
        onBudgetSave={onBudgetSave}
        onBudgetRemove={onBudgetRemove}
        categoryBudgets={categoryBudgets}
        transactions={transactions}
        categoryBudgetsLoading={categoryBudgetsLoading}
        categoryBudgetsSaving={categoryBudgetsSaving}
        categoryBudgetsError={categoryBudgetsError}
        onCategoryBudgetSave={onCategoryBudgetSave}
        onCategoryBudgetRemove={onCategoryBudgetRemove}
        categories={customCategories}
      />

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
              Mới nhất
            </p>
            <h2 className="mt-0.5 text-lg font-black text-slate-900">Giao dịch gần đây</h2>
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
          limit={3}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewReceipt={onViewReceipt}
          categories={customCategories}
        />
      </section>
    </div>
  )
}
