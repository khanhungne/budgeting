import { useEffect, useState, type FormEvent } from 'react'
import { Check, LoaderCircle, Pencil, Plus, Trash2, X, type LucideIcon } from 'lucide-react'
import { formatCompactCurrency, formatCurrency, formatVndInput, parseVndInput } from '../../lib/format'

type LimitTone = 'amber' | 'violet'

type MonthlyLimitCardProps = {
  embedded?: boolean
  amount: number
  used: number
  loading: boolean
  saving: boolean
  tone: LimitTone
  icon: LucideIcon
  eyebrow: string
  emptyAction: string
  placeholder: string
  usageLabel: string
  invalidMessage: string
  saveErrorMessage: string
  overLabel?: string
  quickAmounts?: number[]
  onSave: (amount: number) => Promise<void>
  onRemove?: () => Promise<void>
}

const TONE_STYLES: Record<
  LimitTone,
  {
    section: string
    stamp: string
    eyebrow: string
    focus: string
    submit: string
    segment: string
    empty: string
    loading: string
  }
> = {
  amber: {
    section: 'border border-amber-100 bg-[#fffdf6]',
    stamp: 'border-amber-200 bg-amber-50 text-amber-800 shadow-[3px_3px_0_#f5d58e]',
    eyebrow: 'text-amber-700',
    focus: 'focus-within:border-amber-500',
    submit: 'bg-amber-500 text-amber-950',
    segment: 'bg-amber-500',
    empty: 'border-amber-300 bg-amber-50/60 text-amber-900',
    loading: 'bg-amber-50',
  },
  violet: {
    section: 'border border-violet-100 bg-violet-50/70',
    stamp: 'border-violet-200 bg-white text-violet-800 shadow-[3px_3px_0_#ddd6fe]',
    eyebrow: 'text-violet-700',
    focus: 'focus-within:border-violet-500',
    submit: 'bg-violet-700 text-white',
    segment: 'bg-violet-600',
    empty: 'border-violet-300 bg-white/60 text-violet-800',
    loading: 'bg-violet-100',
  },
}

export const MonthlyLimitCard = ({
  embedded = false,
  amount,
  used,
  loading,
  saving,
  tone,
  icon: Icon,
  eyebrow,
  emptyAction,
  placeholder,
  usageLabel,
  invalidMessage,
  saveErrorMessage,
  overLabel = 'Vượt',
  quickAmounts = [],
  onSave,
  onRemove,
}: MonthlyLimitCardProps) => {
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const styles = TONE_STYLES[tone]

  useEffect(() => {
    setAmountText(amount > 0 ? formatVndInput(amount) : '')
  }, [amount])

  const remaining = amount - used
  const ratio = amount > 0 ? (used / amount) * 100 : 0
  const filledSegments = Math.min(10, Math.ceil(ratio / 10))

  const cancel = () => {
    setEditing(false)
    setError(null)
    setAmountText(amount > 0 ? formatVndInput(amount) : '')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextAmount = parseVndInput(amountText)
    if (!Number.isSafeInteger(nextAmount) || nextAmount <= 0) {
      setError(invalidMessage)
      return
    }
    setError(null)
    try {
      await onSave(nextAmount)
      setEditing(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : saveErrorMessage)
    }
  }

  const remove = async () => {
    if (!onRemove || !window.confirm(`Xóa ${eyebrow.toLocaleLowerCase('vi')}?`)) return
    setRemoving(true)
    setError(null)
    try {
      await onRemove()
      setEditing(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không xóa được hạn mức.')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div
        className={`${embedded ? 'h-32 rounded-xl' : 'mt-5 h-32 rounded-[1.5rem]'} animate-pulse ${styles.loading}`}
      />
    )
  }

  return (
    <section
      className={`${embedded ? 'rounded-xl p-4' : 'mt-5 rounded-[1.5rem] p-5'} ${styles.section}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid size-10 shrink-0 -rotate-2 place-items-center rounded-lg border ${styles.stamp}`}>
            <Icon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${styles.eyebrow}`}>
              {eyebrow}
            </p>
            <h2 className="mt-0.5 truncate text-base font-black text-slate-900">
              {amount > 0 ? formatCurrency(amount) : 'Chưa thiết lập'}
            </h2>
          </div>
        </div>

        {!editing && (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500"
              aria-label={amount > 0 ? `Sửa ${eyebrow.toLocaleLowerCase('vi')}` : emptyAction}
            >
              <Pencil className="size-3.5" />
            </button>
            {amount > 0 && onRemove && (
              <button
                type="button"
                disabled={saving || removing}
                onClick={() => void remove()}
                className="grid size-9 place-items-center rounded-lg border border-red-100 bg-white text-red-500 disabled:opacity-40"
                aria-label={`Xóa ${eyebrow.toLocaleLowerCase('vi')}`}
              >
                {removing ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={submit} className="mt-4">
          <p className="mb-2 text-[11px] font-bold text-slate-500">Số tiền giới hạn</p>
          <label className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 ${styles.focus}`}>
            <span className="text-lg font-black text-slate-400">₫</span>
            <input
              autoFocus
              inputMode="numeric"
              required
              value={amountText}
              onChange={(event) => setAmountText(formatVndInput(event.target.value))}
              placeholder={placeholder}
              className="h-13 min-w-0 bg-transparent text-lg font-black text-slate-900 outline-none placeholder:text-sm placeholder:font-semibold placeholder:text-slate-300"
            />
            <span className="border-l border-slate-100 pl-2 text-[10px] font-black text-slate-400">VND</span>
          </label>

          {quickAmounts.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmountText(formatVndInput(quickAmount))}
                  className="min-w-0 rounded-lg border border-slate-200 bg-white px-1 py-2 text-[10px] font-black text-slate-500"
                >
                  {formatCompactCurrency(quickAmount)}
                </button>
              ))}
            </div>
          )}

          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cancel}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-500"
            >
              <X className="size-4" /> Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex h-11 items-center justify-center gap-2 rounded-lg text-xs font-black disabled:opacity-50 ${styles.submit}`}
            >
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
              Lưu hạn mức
            </button>
          </div>
        </form>
      ) : amount > 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex justify-between gap-3 text-[11px] font-bold">
            <span className={remaining < 0 ? 'text-red-600' : 'text-slate-500'}>
              {remaining >= 0
                ? `Còn ${formatCurrency(remaining)}`
                : `${overLabel} ${formatCurrency(Math.abs(remaining))}`}
            </span>
            <span className={ratio > 100 ? 'text-red-600' : 'text-slate-400'}>
              {Math.round(ratio)}%
            </span>
          </div>
          <div className="grid grid-cols-10 gap-1" role="progressbar" aria-valuenow={Math.round(ratio)}>
            {Array.from({ length: 10 }, (_, index) => (
              <i
                key={index}
                className={`h-2 rounded-[2px] ${
                  index < filledSegments
                    ? remaining < 0
                      ? 'bg-red-500'
                      : ratio > 80
                        ? 'bg-orange-500'
                        : styles.segment
                    : 'bg-slate-200/70'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] font-semibold text-slate-400">
            {usageLabel} {formatCurrency(used)}
          </p>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-xs font-black ${styles.empty}`}
        >
          <Plus className="size-4" /> {emptyAction}
        </button>
      )}
    </section>
  )
}
