import { useEffect, useState, type FormEvent } from 'react'
import { Check, LoaderCircle, Pencil, Target, X } from 'lucide-react'
import { formatCurrency, formatVndInput, parseVndInput } from '../../../lib/format'
import type { MonthlyBudget } from '../types'

type BudgetCardProps = {
  budget: MonthlyBudget | null
  expense: number
  loading: boolean
  saving: boolean
  onSave: (amount: number) => Promise<void>
}

export const BudgetCard = ({
  budget,
  expense,
  loading,
  saving,
  onSave,
}: BudgetCardProps) => {
  const [editing, setEditing] = useState(false)
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAmountText(budget ? formatVndInput(Number(budget.amount)) : '')
  }, [budget])

  const amount = Number(budget?.amount ?? 0)
  const progress = amount > 0 ? Math.min((expense / amount) * 100, 100) : 0
  const remaining = amount - expense

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextAmount = parseVndInput(amountText)
    if (!Number.isSafeInteger(nextAmount) || nextAmount <= 0) {
      setError('Ngân sách VND không hợp lệ hoặc quá lớn.')
      return
    }
    setError(null)
    try {
      await onSave(nextAmount)
      setEditing(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được ngân sách.')
    }
  }

  if (loading) {
    return <div className="mt-5 h-32 animate-pulse rounded-[1.75rem] bg-slate-100" />
  }

  return (
    <section className="mt-5 rounded-[1.75rem] bg-[#fff9e9] p-5 shadow-[0_8px_30px_rgba(76,59,23,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#f9d88f] text-amber-900">
            <Target className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
              Ngân sách tháng
            </p>
            <h2 className="mt-1 font-black text-slate-900">
              {amount > 0 ? formatCurrency(amount) : 'Chưa thiết lập'}
            </h2>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="grid size-9 place-items-center rounded-xl bg-white/80 text-amber-800"
            aria-label={amount > 0 ? 'Sửa ngân sách' : 'Đặt ngân sách'}
          >
            <Pencil className="size-4" />
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={submit} className="mt-4">
          <label className="flex items-center rounded-2xl border border-amber-200 bg-white px-4 focus-within:border-amber-600">
            <input
              autoFocus
              inputMode="numeric"
              required
              value={amountText}
              onChange={(event) => setAmountText(formatVndInput(event.target.value))}
              placeholder="Ví dụ: 5.000.000"
              className="h-14 min-w-0 flex-1 bg-transparent text-lg font-black text-slate-900 outline-none"
            />
            <span className="text-xs font-black text-slate-400">VND</span>
          </label>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setError(null)
                setAmountText(budget ? formatVndInput(Number(budget.amount)) : '')
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-slate-500"
            >
              <X className="size-4" /> Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 text-xs font-black text-amber-950 disabled:opacity-50"
            >
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              Lưu
            </button>
          </div>
        </form>
      ) : amount > 0 ? (
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-bold">
            <span className={remaining < 0 ? 'text-red-600' : 'text-slate-500'}>
              {remaining >= 0
                ? `Còn ${formatCurrency(remaining)}`
                : `Vượt ${formatCurrency(Math.abs(remaining))}`}
            </span>
            <span className="text-slate-500">{Math.round((expense / amount) * 100)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-amber-100">
            <div
              className={`h-full rounded-full transition-all ${
                remaining < 0 ? 'bg-red-500' : progress > 80 ? 'bg-orange-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Đã chi {formatCurrency(expense)} trong tháng
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 w-full rounded-2xl border border-dashed border-amber-300 py-3 text-xs font-black text-amber-800"
        >
          Đặt giới hạn chi tiêu
        </button>
      )}
    </section>
  )
}
