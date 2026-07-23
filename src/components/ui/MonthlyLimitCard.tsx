import { useEffect, useState, type FormEvent } from 'react'
import { Check, LoaderCircle, Pencil, X, type LucideIcon } from 'lucide-react'
import { formatCurrency, formatVndInput, parseVndInput } from '../../lib/format'

type LimitTone = 'amber' | 'violet'

type MonthlyLimitCardProps = {
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
  onSave: (amount: number) => Promise<void>
}

const TONE_STYLES: Record<
  LimitTone,
  {
    section: string
    icon: string
    eyebrow: string
    edit: string
    input: string
    submit: string
    track: string
    progress: string
    empty: string
    loading: string
  }
> = {
  amber: {
    section:
      'bg-[#fff9e9] shadow-[0_8px_30px_rgba(76,59,23,0.06)]',
    icon: 'bg-[#f9d88f] text-amber-900',
    eyebrow: 'text-amber-700',
    edit: 'bg-white/80 text-amber-800',
    input: 'border-amber-200 focus-within:border-amber-600',
    submit: 'bg-amber-500 text-amber-950',
    track: 'bg-amber-100',
    progress: 'bg-amber-500',
    empty: 'border-amber-300 text-amber-800',
    loading: 'bg-slate-100',
  },
  violet: {
    section: 'border border-violet-100 bg-violet-50',
    icon: 'bg-violet-200 text-violet-900',
    eyebrow: 'text-violet-700',
    edit: 'bg-white text-violet-800',
    input: 'border-violet-200 focus-within:border-violet-600',
    submit: 'bg-violet-700 text-white',
    track: 'bg-violet-100',
    progress: 'bg-violet-600',
    empty: 'border-violet-300 text-violet-800',
    loading: 'bg-violet-100',
  },
}

export const MonthlyLimitCard = ({
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
  onSave,
}: MonthlyLimitCardProps) => {
  const [editing, setEditing] = useState(false)
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const styles = TONE_STYLES[tone]

  useEffect(() => {
    setAmountText(amount > 0 ? formatVndInput(amount) : '')
  }, [amount])

  const remaining = amount - used
  const ratio = amount > 0 ? (used / amount) * 100 : 0
  const progress = Math.min(ratio, 100)

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

  if (loading) {
    return (
      <div
        className={`mt-5 h-32 animate-pulse rounded-[1.75rem] ${styles.loading}`}
      />
    )
  }

  return (
    <section className={`mt-5 rounded-[1.75rem] p-5 ${styles.section}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid size-11 place-items-center rounded-2xl ${styles.icon}`}>
            <Icon className="size-5" />
          </span>
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-[0.14em] ${styles.eyebrow}`}
            >
              {eyebrow}
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
            className={`grid size-9 place-items-center rounded-xl ${styles.edit}`}
            aria-label={amount > 0 ? `Sửa ${eyebrow.toLocaleLowerCase('vi')}` : emptyAction}
          >
            <Pencil className="size-4" />
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={submit} className="mt-4">
          <label
            className={`flex items-center rounded-2xl border bg-white px-4 ${styles.input}`}
          >
            <input
              autoFocus
              inputMode="numeric"
              required
              value={amountText}
              onChange={(event) => setAmountText(formatVndInput(event.target.value))}
              placeholder={placeholder}
              className="h-14 min-w-0 flex-1 bg-transparent text-lg font-black outline-none"
            />
            <span className="text-xs font-black text-slate-400">VND</span>
          </label>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cancel}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-slate-500"
            >
              <X className="size-4" /> Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-black disabled:opacity-50 ${styles.submit}`}
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
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
                : `${overLabel} ${formatCurrency(Math.abs(remaining))}`}
            </span>
            <span className={ratio > 100 ? 'text-red-600' : 'text-slate-500'}>
              {Math.round(ratio)}%
            </span>
          </div>
          <div className={`h-2.5 overflow-hidden rounded-full ${styles.track}`}>
            <div
              className={`h-full rounded-full ${
                remaining < 0
                  ? 'bg-red-500'
                  : ratio > 80
                    ? 'bg-orange-500'
                    : styles.progress
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {usageLabel} {formatCurrency(used)}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`mt-4 w-full rounded-2xl border border-dashed py-3 text-xs font-black ${styles.empty}`}
        >
          {emptyAction}
        </button>
      )}
    </section>
  )
}
