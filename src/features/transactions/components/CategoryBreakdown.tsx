import { formatCompactCurrency } from '../../../lib/format'
import { getCategory } from '../constants'
import type { Transaction } from '../types'

export const CategoryBreakdown = ({ transactions }: { transactions: Transaction[] }) => {
  const groups = Object.entries(
    transactions
      .filter((transaction) => transaction.kind === 'expense')
      .reduce<Record<string, number>>((result, transaction) => {
        result[transaction.category] =
          (result[transaction.category] ?? 0) + Number(transaction.amount)
        return result
      }, {}),
  )
    .sort(([, first], [, second]) => second - first)
    .slice(0, 4)

  const max = groups[0]?.[1] ?? 1

  if (groups.length === 0) {
    return <p className="py-4 text-center text-sm text-slate-400">Chưa có khoản chi trong tháng.</p>
  }

  return (
    <div className="space-y-4">
      {groups.map(([id, amount]) => {
        const category = getCategory(id)
        return (
          <div key={id}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-bold text-slate-700">
                <span>{category.emoji}</span>
                {category.label}
              </span>
              <span className="font-extrabold text-slate-600">
                {formatCompactCurrency(amount)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(amount / max) * 100}%`, backgroundColor: category.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
