import { useEffect, useState, type FormEvent } from 'react'
import { Check, Gauge, LoaderCircle, Pencil, X } from 'lucide-react'
import { formatCurrency, formatVndInput, parseVndInput } from '../../../lib/format'
import type { LotteryMonthlyLimit } from '../limitTypes'

type LotteryLimitCardProps = {
  limit: LotteryMonthlyLimit | null
  stake: number
  loading: boolean
  saving: boolean
  onSave: (amount: number) => Promise<void>
}

export const LotteryLimitCard = ({
  limit,
  stake,
  loading,
  saving,
  onSave,
}: LotteryLimitCardProps) => {
  const [editing, setEditing] = useState(false)
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAmountText(limit ? formatVndInput(Number(limit.amount)) : '')
  }, [limit])

  const amount = Number(limit?.amount ?? 0)
  const remaining = amount - stake
  const ratio = amount > 0 ? (stake / amount) * 100 : 0
  const progress = Math.min(ratio, 100)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextAmount = parseVndInput(amountText)
    if (!Number.isSafeInteger(nextAmount) || nextAmount <= 0) {
      setError('Hạn mức VND không hợp lệ hoặc quá lớn.')
      return
    }
    setError(null)
    try {
      await onSave(nextAmount)
      setEditing(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được hạn mức.')
    }
  }

  if (loading) {
    return <div className="mt-5 h-32 animate-pulse rounded-[1.75rem] bg-violet-100" />
  }

  return (
    <section className="mt-5 rounded-[1.75rem] border border-violet-100 bg-violet-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-violet-200 text-violet-900">
            <Gauge className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
              Hạn mức tự đặt
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
            className="grid size-9 place-items-center rounded-xl bg-white text-violet-800"
            aria-label={amount > 0 ? 'Sửa hạn mức' : 'Đặt hạn mức'}
          >
            <Pencil className="size-4" />
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={submit} className="mt-4">
          <label className="flex items-center rounded-2xl border border-violet-200 bg-white px-4 focus-within:border-violet-600">
            <input
              autoFocus
              inputMode="numeric"
              required
              value={amountText}
              onChange={(event) => setAmountText(formatVndInput(event.target.value))}
              placeholder="Ví dụ: 500.000"
              className="h-14 min-w-0 flex-1 bg-transparent text-lg font-black outline-none"
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
                setAmountText(limit ? formatVndInput(Number(limit.amount)) : '')
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-slate-500"
            >
              <X className="size-4" /> Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 text-xs font-black text-white disabled:opacity-50"
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
                : `Đã vượt ${formatCurrency(Math.abs(remaining))}`}
            </span>
            <span className={ratio > 100 ? 'text-red-600' : 'text-slate-500'}>
              {Math.round(ratio)}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-violet-100">
            <div
              className={`h-full rounded-full ${
                remaining < 0 ? 'bg-red-500' : ratio > 80 ? 'bg-orange-500' : 'bg-violet-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Tổng tiền vào tháng này: {formatCurrency(stake)}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 w-full rounded-2xl border border-dashed border-violet-300 py-3 text-xs font-black text-violet-800"
        >
          Đặt trần tiền vào mỗi tháng
        </button>
      )}
    </section>
  )
}
