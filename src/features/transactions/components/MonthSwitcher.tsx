import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonth, shiftMonth } from '../../../lib/dates'

type MonthSwitcherProps = {
  month: string
  onChange: (month: string) => void
}

export const MonthSwitcher = ({ month, onChange }: MonthSwitcherProps) => (
  <div className="flex items-center justify-between">
    <button
      type="button"
      onClick={() => onChange(shiftMonth(month, -1))}
      className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      aria-label="Tháng trước"
    >
      <ChevronLeft className="size-5" />
    </button>
    <p className="text-sm font-bold capitalize text-white">{formatMonth(month)}</p>
    <button
      type="button"
      onClick={() => onChange(shiftMonth(month, 1))}
      className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      aria-label="Tháng sau"
    >
      <ChevronRight className="size-5" />
    </button>
  </div>
)
