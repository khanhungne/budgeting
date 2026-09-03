import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonth, shiftMonth } from '../../../lib/dates'

type MonthSwitcherProps = {
  month: string
  onChange: (month: string) => void
  variant?: 'light' | 'dark'
}

export const MonthSwitcher = ({ month, onChange, variant = 'light' }: MonthSwitcherProps) => (
  <div className="flex items-center justify-between">
    <button
      type="button"
      onClick={() => onChange(shiftMonth(month, -1))}
      className={`grid size-11 place-items-center rounded-lg border transition active:scale-95 ${
        variant === 'dark'
          ? 'border-white/15 bg-white/10 text-amber-100 hover:bg-white/15'
          : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:text-emerald-800'
      }`}
      aria-label="Tháng trước"
    >
      <ChevronLeft className="size-5" />
    </button>
    <p
      className={`text-sm font-black capitalize ${
        variant === 'dark' ? 'text-white' : 'text-slate-800'
      }`}
    >
      {formatMonth(month)}
    </p>
    <button
      type="button"
      onClick={() => onChange(shiftMonth(month, 1))}
      className={`grid size-11 place-items-center rounded-lg border transition active:scale-95 ${
        variant === 'dark'
          ? 'border-white/15 bg-white/10 text-amber-100 hover:bg-white/15'
          : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:text-emerald-800'
      }`}
      aria-label="Tháng sau"
    >
      <ChevronRight className="size-5" />
    </button>
  </div>
)
