import { Pencil, Plus, Target, Trash2, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { formatCurrency, formatVndInput, parseVndInput } from '../../../lib/format'
import { getCategory } from '../../transactions/constants'
import type { Category, Transaction } from '../../transactions/types'
import type { CategoryBudget } from '../categoryTypes'

type CategoryBudgetCardProps = {
  embedded?: boolean
  budgets: CategoryBudget[]
  transactions: Transaction[]
  customCategories: Category[]
  loading: boolean
  saving: boolean
  error?: string | null
  onSave: (category: string, amount: number) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export const CategoryBudgetCard = ({
  embedded = false,
  budgets,
  transactions,
  customCategories,
  loading,
  saving,
  error,
  onSave,
  onRemove,
}: CategoryBudgetCardProps) => {
  const [adding, setAdding] = useState(false)
  const [category, setCategory] = useState('food')
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const options = useMemo(() => {
    const ids = new Set(
      customCategories
        .filter((item) => item.kind === 'expense')
        .map((item) => item.id),
    )
    transactions
      .filter((item) => item.kind === 'expense')
      .forEach((item) => ids.add(item.category))
    return [...ids].map((id) => getCategory(id, customCategories))
  }, [customCategories, transactions])

  const spentByCategory = useMemo(() => {
    const totals = new Map<string, number>()
    transactions.forEach((item) => {
      if (item.kind !== 'expense') return
      totals.set(item.category, (totals.get(item.category) ?? 0) + Number(item.amount))
    })
    return totals
  }, [transactions])

  const edit = (budget: CategoryBudget) => {
    setCategory(budget.category)
    setAmount(formatVndInput(Number(budget.amount)))
    setFormError(null)
    setAdding(true)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = parseVndInput(amount)
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      setFormError('Hạn mức phải lớn hơn 0 và không được quá lớn.')
      return
    }
    try {
      setFormError(null)
      await onSave(category, parsed)
      setAmount('')
      setAdding(false)
    } catch {
      // Giữ form mở để người dùng có thể thử lưu lại.
    }
  }

  return (
    <section
      className={
        embedded
          ? 'mt-4 border-t border-dashed border-slate-200 px-1 pt-5'
          : 'mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]'
      }
    >
      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
            <Target className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-sky-700">
              Tùy chọn
            </p>
            <h3 className="truncate text-sm font-black text-slate-900">
              Hạn mức theo danh mục
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setAdding((value) => !value)
            setFormError(null)
          }}
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${
            adding ? 'bg-slate-100 text-slate-500' : 'bg-sky-50 text-sky-700'
          }`}
          aria-label={adding ? 'Đóng form hạn mức danh mục' : 'Thêm hạn mức danh mục'}
        >
          {adding ? <X className="size-4" /> : <Plus className="size-4" />}
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} className="mt-4 rounded-xl border border-sky-100 bg-sky-50/60 p-3">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-sky-700">Danh mục muốn nhắc</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
            >
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.emoji} {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-sky-700">Số tiền giới hạn</span>
            <span className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-sky-500">
              <b className="text-base text-slate-400">₫</b>
              <input
                required
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(formatVndInput(event.target.value))}
                placeholder="Ví dụ: 1.000.000"
                className="h-12 min-w-0 bg-transparent text-sm font-black text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-300"
              />
              <span className="border-l border-slate-100 pl-2 text-[9px] font-black text-slate-400">VND</span>
            </span>
          </label>

          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[500_000, 1_000_000, 2_000_000, 3_000_000].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(formatVndInput(value))}
                className="rounded-lg border border-slate-200 bg-white px-1 py-2 text-[9px] font-black text-slate-500"
              >
                {formatCurrency(value).replace(/\s?₫/, '')}
              </button>
            ))}
          </div>

          {formError && <p className="mt-2 text-[11px] font-semibold text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-3 h-11 w-full rounded-lg bg-sky-700 px-4 text-xs font-black text-white disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Lưu hạn mức danh mục'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="mt-4 h-16 animate-pulse rounded-xl bg-slate-100" />
      ) : budgets.length ? (
        <div className="mt-4 space-y-3">
          {budgets.map((budget) => {
            const info = getCategory(budget.category, customCategories)
            const spent = spentByCategory.get(budget.category) ?? 0
            const limit = Number(budget.amount)
            const remaining = limit - spent
            const ratio = (spent / limit) * 100
            const filledSegments = Math.min(8, Math.ceil(ratio / 12.5))
            const exceeded = remaining < 0

            return (
              <article key={budget.id} className="rounded-2xl bg-slate-50 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-700">
                      {info.emoji} {info.label}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      {formatCurrency(spent)} / {formatCurrency(limit)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => edit(budget)}
                      className="text-sky-500"
                      aria-label={`Sửa hạn mức ${info.label}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemove(budget.id)}
                      className="text-red-400"
                      aria-label={`Xóa hạn mức ${info.label}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="grid min-w-0 flex-1 grid-cols-8 gap-1" role="progressbar" aria-valuenow={Math.round(ratio)}>
                    {Array.from({ length: 8 }, (_, index) => (
                      <i
                        key={index}
                        className={`h-1.5 rounded-[2px] ${
                          index < filledSegments
                            ? exceeded
                              ? 'bg-red-500'
                              : 'bg-sky-500'
                            : 'bg-slate-200/70'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`whitespace-nowrap text-[10px] font-black ${exceeded ? 'text-red-600' : 'text-slate-400'}`}>
                    {exceeded
                      ? `Vượt ${formatCurrency(Math.abs(remaining))}`
                      : `Còn ${formatCurrency(remaining)}`}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-sky-100 bg-sky-50/50 px-4 py-3 text-center">
          <p className="text-xs font-bold text-sky-800/70">Chưa có hạn mức danh mục</p>
          <p className="mt-1 text-[10px] text-slate-400">
            Chỉ thêm cho những khoản bạn muốn được nhắc.
          </p>
        </div>
      )}
    </section>
  )
}
