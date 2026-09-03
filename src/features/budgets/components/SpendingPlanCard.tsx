import { BellRing, ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
import { formatCurrency } from '../../../lib/format'
import { getCategory } from '../../transactions/constants'
import type { Category, Transaction } from '../../transactions/types'
import type { CategoryBudget } from '../categoryTypes'
import { getSpendingWarnings } from '../spendingWarnings'
import type { MonthlyBudget } from '../types'
import { BudgetCard } from './BudgetCard'
import { CategoryBudgetCard } from './CategoryBudgetCard'

type SpendingPlanCardProps = {
  budget: MonthlyBudget | null
  expense: number
  budgetLoading: boolean
  budgetSaving: boolean
  onBudgetSave: (amount: number) => Promise<void>
  categoryBudgets: CategoryBudget[]
  transactions: Transaction[]
  categoryBudgetsLoading: boolean
  categoryBudgetsSaving: boolean
  categoryBudgetsError: string | null
  onCategoryBudgetSave: (category: string, amount: number) => Promise<void>
  onCategoryBudgetRemove: (id: string) => Promise<void>
  categories: Category[]
}

export const SpendingPlanCard = ({
  budget,
  expense,
  budgetLoading,
  budgetSaving,
  onBudgetSave,
  categoryBudgets,
  transactions,
  categoryBudgetsLoading,
  categoryBudgetsSaving,
  categoryBudgetsError,
  onCategoryBudgetSave,
  onCategoryBudgetRemove,
  categories,
}: SpendingPlanCardProps) => {
  const warnings = useMemo(
    () => getSpendingWarnings(budget, categoryBudgets, transactions),
    [budget, categoryBudgets, transactions],
  )

  return (
    <section className="relative mt-5 overflow-hidden rounded-[1.9rem] bg-white p-4 shadow-[0_12px_36px_rgba(70,54,22,0.08)]">
      <span className="pointer-events-none absolute -right-4 -top-10 size-28 rounded-full bg-amber-100/75" />
      <span className="pointer-events-none absolute right-20 top-6 size-3 rotate-12 rounded-sm bg-sky-400/60" />

      <div className="relative flex items-start justify-between gap-3 px-1 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 -rotate-3 place-items-center rounded-2xl bg-amber-400 text-amber-950 shadow-[0_6px_0_#d28a20]">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">
              Chỉ nhắc · không chặn
            </p>
            <h2 className="mt-0.5 truncate text-lg font-black text-slate-900">
              Kế hoạch chi tiêu
            </h2>
          </div>
        </div>
        <span className="relative mt-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700">
          Tự đặt
        </span>
      </div>

      {warnings.length > 0 && (
        <div
          role="status"
          className="relative mb-3 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-3.5"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-500 text-white">
            <BellRing className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-red-800">Hơi quá hạn mức rồi</p>
            <div className="mt-1 space-y-0.5">
              {warnings.map((warning) => {
                const label =
                  warning.scope === 'month'
                    ? 'Hạn mức tháng'
                    : `${getCategory(warning.category, categories).emoji} ${getCategory(warning.category, categories).label}`
                return (
                  <p
                    key={`${warning.scope}-${warning.scope === 'category' ? warning.category : 'month'}`}
                    className="text-[11px] font-semibold leading-4 text-red-600"
                  >
                    {label} vượt {formatCurrency(warning.overBy)}
                  </p>
                )
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-red-500/75">
              Đây chỉ là lời nhắc, mọi giao dịch vẫn được giữ nguyên.
            </p>
          </div>
        </div>
      )}

      <BudgetCard
        embedded
        budget={budget}
        expense={expense}
        loading={budgetLoading}
        saving={budgetSaving}
        onSave={onBudgetSave}
      />

      <CategoryBudgetCard
        embedded
        budgets={categoryBudgets}
        transactions={transactions}
        loading={categoryBudgetsLoading}
        saving={categoryBudgetsSaving}
        error={categoryBudgetsError}
        onSave={onCategoryBudgetSave}
        onRemove={(id) => onCategoryBudgetRemove(id).catch(() => undefined)}
        customCategories={categories}
      />
    </section>
  )
}
