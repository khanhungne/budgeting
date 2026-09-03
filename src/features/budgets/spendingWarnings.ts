import type { Transaction } from '../transactions/types'
import type { CategoryBudget } from './categoryTypes'
import type { MonthlyBudget } from './types'

export type SpendingWarning =
  | { scope: 'month'; overBy: number }
  | { scope: 'category'; category: string; overBy: number }

export const getSpendingWarnings = (
  budget: MonthlyBudget | null,
  categoryBudgets: CategoryBudget[],
  transactions: Transaction[],
): SpendingWarning[] => {
  const warnings: SpendingWarning[] = []
  const spentByCategory = new Map<string, number>()
  let totalExpense = 0

  transactions.forEach((transaction) => {
    if (transaction.kind !== 'expense') return
    const amount = Number(transaction.amount)
    totalExpense += amount
    spentByCategory.set(
      transaction.category,
      (spentByCategory.get(transaction.category) ?? 0) + amount,
    )
  })

  const monthlyLimit = Number(budget?.amount ?? 0)
  if (monthlyLimit > 0 && totalExpense > monthlyLimit) {
    warnings.push({ scope: 'month', overBy: totalExpense - monthlyLimit })
  }

  categoryBudgets.forEach((categoryBudget) => {
    const limit = Number(categoryBudget.amount)
    const spent = spentByCategory.get(categoryBudget.category) ?? 0
    if (limit > 0 && spent > limit) {
      warnings.push({
        scope: 'category',
        category: categoryBudget.category,
        overBy: spent - limit,
      })
    }
  })

  return warnings
}
