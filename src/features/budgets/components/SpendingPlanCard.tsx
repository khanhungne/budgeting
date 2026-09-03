import { BellRing, ChevronDown, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const [open, setOpen] = useState(false)
  const warnings = useMemo(
    () => getSpendingWarnings(budget, categoryBudgets, transactions),
    [budget, categoryBudgets, transactions],
  )
  const monthlyUsage = budget ? Math.round((expense / Number(budget.amount)) * 100) : null
  const summary = budgetLoading
    ? 'Đang tải kế hoạch…'
    : warnings.length
      ? `${warnings.length} hạn mức đang bị vượt`
      : monthlyUsage === null
        ? 'Chưa đặt hạn mức tháng'
        : `Đã dùng ${monthlyUsage}% hạn mức tháng`

  return (
    <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-[0_6px_22px_rgba(23,48,40,0.04)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-2xl ${
            warnings.length ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {warnings.length ? <BellRing className="size-5" /> : <ShieldCheck className="size-5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-900">Kế hoạch chi tiêu</span>
          <span
            className={`mt-0.5 block truncate text-[11px] font-semibold ${
              warnings.length ? 'text-red-600' : 'text-slate-400'
            }`}
          >
            {summary}
          </span>
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {!open && warnings.length > 0 && (
        <div role="status" className="mx-4 mb-4 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
          Chạm để xem khoản đã vượt và điều chỉnh hạn mức.
        </div>
      )}

      {open && (
        <div className="border-t border-slate-100 p-4">
          {warnings.length > 0 && (
            <div role="status" className="mb-3 flex gap-3 rounded-2xl bg-red-50 p-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-500 text-white">
                <BellRing className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black text-red-800">Đã vượt hạn mức</p>
                <div className="mt-1 space-y-0.5">
                  {warnings.map((warning) => {
                    const category =
                      warning.scope === 'category'
                        ? getCategory(warning.category, categories)
                        : null
                    const label = category
                      ? `${category.emoji} ${category.label}`
                      : 'Hạn mức tháng'
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
        </div>
      )}
    </section>
  )
}
