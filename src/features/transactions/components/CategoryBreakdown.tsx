import { formatCompactCurrency } from '../../../lib/format'
import { getCategory } from '../constants'
import type { Category, Transaction } from '../types'

export const CategoryBreakdown = ({ transactions, categories = [] }: { transactions: Transaction[]; categories?: Category[] }) => {
  const allGroups = Object.entries(
    transactions
      .filter((transaction) => transaction.kind === 'expense')
      .reduce<Record<string, number>>((result, transaction) => {
        result[transaction.category] =
          (result[transaction.category] ?? 0) + Number(transaction.amount)
        return result
      }, {}),
  )
    .sort(([, first], [, second]) => second - first)
  const total = allGroups.reduce((sum, [, amount]) => sum + amount, 0)
  const groups = allGroups.slice(0, 4)
  const chartGroups = groups.map(([id, amount]) => ({
    ...getCategory(id, categories),
    amount,
  }))
  const visibleTotal = chartGroups.reduce((sum, item) => sum + item.amount, 0)
  const other = total - visibleTotal
  const segments = [
    ...chartGroups.map((item) => ({ color: item.color, amount: item.amount })),
    ...(other > 0 ? [{ color: '#d9dfdc', amount: other }] : []),
  ]
  let cursor = 0
  const chartBackground = `conic-gradient(${segments
    .map((segment) => {
      const start = cursor
      cursor += total ? (segment.amount / total) * 100 : 0
      return `${segment.color} ${start}% ${cursor}%`
    })
    .join(', ')})`

  if (groups.length === 0) {
    return (
      <div className="py-5 text-center">
        <span className="mx-auto grid size-16 -rotate-3 place-items-center rounded-[1.4rem] bg-emerald-50 text-3xl">🍃</span>
        <p className="mt-3 text-sm font-bold text-slate-600">Tháng này ví còn rất bình yên</p>
        <p className="mt-1 text-xs text-slate-400">Các mảnh màu sẽ xuất hiện khi có khoản chi.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[7rem_1fr] items-center gap-5">
        <div
          className="relative grid size-28 place-items-center rounded-full shadow-[0_10px_26px_rgba(42,69,59,0.12)]"
          style={{ background: chartBackground }}
          role="img"
          aria-label={`Biểu đồ tổng chi ${formatCompactCurrency(total)}`}
        >
          <div className="grid size-[4.6rem] place-items-center rounded-full bg-white text-center shadow-inner">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">Tổng chi</p>
              <p className="mt-0.5 text-xs font-black text-slate-800">{formatCompactCurrency(total)}</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          {chartGroups.map((category, index) => (
            <div key={category.id} className="flex items-center gap-2.5">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-xl text-base ${index === 0 ? '-rotate-3' : ''}`}
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="truncate text-[11px] font-black text-slate-700">{category.label}</span>
                  <span className="text-[10px] font-black text-slate-400">
                    {Math.round((category.amount / total) * 100)}%
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">
                  {formatCompactCurrency(category.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#fff4dc] p-3.5">
        <span className="text-xl">🏆</span>
        <p className="min-w-0 text-xs leading-5 text-amber-950/70">
          Chiếm sóng nhiều nhất là{' '}
          <strong className="font-black text-amber-950">{chartGroups[0].label}</strong>, khoảng{' '}
          <strong className="font-black text-amber-950">
            {Math.round((chartGroups[0].amount / total) * 100)}%
          </strong>{' '}
          tổng chi.
        </p>
      </div>
    </div>
  )
}
