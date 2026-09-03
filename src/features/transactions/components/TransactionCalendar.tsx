import { useMemo, type KeyboardEvent } from 'react'
import { currentDate } from '../../../lib/dates'
import { formatCurrency, formatDate } from '../../../lib/format'
import { buildTransactionCalendar, type TransactionCalendarCell } from '../calendar'
import { getCategory } from '../constants'
import type { Category, Transaction } from '../types'

type TransactionCalendarProps = {
  month: string
  transactions: Transaction[]
  categories: Category[]
  selectedDate: string
  onSelectDate: (date: string) => void
}

type ElementId = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const elementOrder: ElementId[] = ['wood', 'fire', 'earth', 'metal', 'water']
const elements: Record<
  ElementId,
  { label: string; meaning: string; accent: string; soft: string; text: string }
> = {
  wood: {
    label: 'Mộc',
    meaning: 'Sinh trưởng',
    accent: 'bg-[#3f8a68]',
    soft: 'bg-[#e9f3e9]',
    text: 'text-[#2f7255]',
  },
  fire: {
    label: 'Hỏa',
    meaning: 'Chuyển động',
    accent: 'bg-[#d86f48]',
    soft: 'bg-[#fff0e8]',
    text: 'text-[#ad4e31]',
  },
  earth: {
    label: 'Thổ',
    meaning: 'Ổn định',
    accent: 'bg-[#c69a43]',
    soft: 'bg-[#fbf3dd]',
    text: 'text-[#8a681f]',
  },
  metal: {
    label: 'Kim',
    meaning: 'Tích lũy',
    accent: 'bg-[#899592]',
    soft: 'bg-[#eff2f0]',
    text: 'text-[#65716e]',
  },
  water: {
    label: 'Thủy',
    meaning: 'Luân chuyển',
    accent: 'bg-[#397f91]',
    soft: 'bg-[#e8f3f5]',
    text: 'text-[#296777]',
  },
}

const categoryElements: Record<string, ElementId> = {
  education: 'wood',
  health: 'wood',
  salary: 'wood',
  fun: 'fire',
  bonus: 'fire',
  food: 'earth',
  bills: 'earth',
  'other-expense': 'earth',
  shopping: 'metal',
  investment: 'metal',
  transport: 'water',
  'other-income': 'water',
}

const elementForCategory = (categoryId: string): ElementId => {
  const knownElement = categoryElements[categoryId]
  if (knownElement) return knownElement

  const hash = [...categoryId].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return elementOrder[hash % elementOrder.length]
}

const calendarWeeks = (cells: TransactionCalendarCell[]) =>
  Array.from({ length: Math.ceil(cells.length / 7) }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  )

export const TransactionCalendar = ({
  month,
  transactions,
  categories,
  selectedDate,
  onSelectDate,
}: TransactionCalendarProps) => {
  const cells = useMemo(
    () => buildTransactionCalendar(month, transactions),
    [month, transactions],
  )
  const weeks = useMemo(() => calendarWeeks(cells), [cells])
  const today = currentDate()

  const focusCell = (index: number) => {
    const day = cells[index]
    if (!day) return
    onSelectDate(day.date)
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLButtonElement>(`[data-calendar-date="${day.date}"]`)
        ?.focus()
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let targetIndex: number | null = null

    if (event.key === 'ArrowLeft') targetIndex = index - 1
    if (event.key === 'ArrowRight') targetIndex = index + 1
    if (event.key === 'ArrowUp') targetIndex = index - 7
    if (event.key === 'ArrowDown') targetIndex = index + 7

    if (event.key === 'Home' || event.key === 'End') {
      const weekStart = Math.floor(index / 7) * 7
      const weekIndexes = Array.from({ length: 7 }, (_, offset) => weekStart + offset)
      const availableIndexes = weekIndexes.filter((cellIndex) => cells[cellIndex])
      targetIndex = event.key === 'Home' ? availableIndexes[0] : availableIndexes.at(-1) ?? null
    }

    if (targetIndex === null || targetIndex < 0 || targetIndex >= cells.length || !cells[targetIndex]) {
      return
    }

    event.preventDefault()
    focusCell(targetIndex)
  }

  return (
    <section className="cashflow-calendar overflow-hidden border border-[#e9dfc7] bg-[#fffdf7] shadow-[0_10px_30px_rgba(61,52,30,0.07)]">
      <div
        role="grid"
        aria-label="Lịch dòng tiền theo ngày"
        aria-describedby="cashflow-calendar-legend"
        className="relative z-10 p-3"
      >
        <div role="row" className="grid grid-cols-7 gap-1 pb-2">
          {weekdays.map((weekday, index) => (
            <span
              key={weekday}
              role="columnheader"
              className={`py-1 text-center text-[10px] font-black uppercase tracking-wide ${
                index > 4 ? 'text-[#b35b3c]' : 'text-slate-400'
              }`}
            >
              {weekday}
            </span>
          ))}
        </div>

        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} role="row" className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const flatIndex = weekIndex * 7 + dayIndex
                if (!day) {
                  return <span key={`blank-${flatIndex}`} role="gridcell" aria-hidden="true" />
                }

                const selected = day.date === selectedDate
                const hasTransactions = day.transactionCount > 0
                const primaryCategory = hasTransactions
                  ? getCategory(day.categoryIds[0], categories)
                  : null
                const element = elements[
                  primaryCategory ? elementForCategory(primaryCategory.id) : 'metal'
                ]
                const label = `${formatDate(day.date)}: ${day.expenseCount} khoản chi ${formatCurrency(day.expense)}, ${day.incomeCount} khoản thu ${formatCurrency(day.income)}${primaryCategory ? `, hành ${element.label}` : ''}`

                return (
                  <span
                    key={day.date}
                    role="gridcell"
                    aria-selected={selected}
                    className="min-w-0"
                  >
                    <button
                      type="button"
                      data-calendar-date={day.date}
                      aria-label={label}
                      aria-current={day.date === today ? 'date' : undefined}
                      aria-controls="daily-cashbook"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => onSelectDate(day.date)}
                      onKeyDown={(event) => handleKeyDown(event, flatIndex)}
                      className={`relative flex h-[4.15rem] w-full min-w-0 flex-col justify-between overflow-hidden rounded-[0.6rem] border p-1 text-left transition active:scale-[0.97] ${
                        selected
                          ? 'border-[#153f35] bg-[#153f35] text-white shadow-[3px_3px_0_#d5a444]'
                          : hasTransactions
                            ? 'border-[#e8deca] bg-white/85 text-slate-700 hover:border-[#c9b783]'
                            : 'border-transparent bg-[#f5f5ef]/80 text-slate-400 hover:border-[#ded9cb]'
                      } ${
                        day.date === today && !selected
                          ? 'outline outline-2 outline-offset-[-2px] outline-[#d5a444]'
                          : ''
                      }`}
                    >
                      <span className={`absolute inset-x-1 top-0 h-[3px] ${element.accent}`} />
                      <span className="mt-1 flex w-full items-start justify-between gap-0.5">
                        <b className="text-[10px] leading-none">{day.day}</b>
                        {hasTransactions && (
                          <b
                            className={`rounded-[3px] px-1 py-0.5 text-[9px] leading-none ${
                              selected ? 'bg-white/15 text-amber-100' : `${element.soft} ${element.text}`
                            }`}
                          >
                            {day.transactionCount}
                          </b>
                        )}
                      </span>

                      {primaryCategory ? (
                        <span
                          aria-hidden="true"
                          className={`grid size-6 place-items-center self-center rounded-[5px] text-[15px] ${
                            selected ? 'bg-white/10' : element.soft
                          }`}
                        >
                          {primaryCategory.emoji}
                        </span>
                      ) : (
                        <span aria-hidden="true" className="h-6" />
                      )}

                      <span className="grid w-full grid-cols-2 gap-0.5" aria-hidden="true">
                        <i
                          className={`h-1 rounded-[1px] ${
                            day.incomeCount
                              ? selected
                                ? 'bg-[#8fd5a8]'
                                : 'bg-[#3f9a69]'
                              : selected
                                ? 'bg-white/15'
                                : 'bg-slate-200'
                          }`}
                        />
                        <i
                          className={`h-1 rounded-[1px] ${
                            day.expenseCount
                              ? selected
                                ? 'bg-[#ffb082]'
                                : 'bg-[#dc7450]'
                              : selected
                                ? 'bg-white/15'
                                : 'bg-slate-200'
                          }`}
                        />
                      </span>
                    </button>
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div id="cashflow-calendar-legend" className="relative z-10 border-t border-[#ece3cf] bg-white/65 px-3 py-3">
        <div className="grid grid-cols-5 gap-1">
          {elementOrder.map((elementId) => {
            const element = elements[elementId]
            return (
              <span key={elementId} title={element.meaning} className="min-w-0 text-center">
                <i className={`mx-auto block h-1 w-5 rounded-[1px] ${element.accent}`} />
                <b className={`mt-1 block text-[9px] uppercase ${element.text}`}>{element.label}</b>
              </span>
            )
          })}
        </div>
        <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
          Nét trái: Thu vào · Nét phải: Chi ra · Màu trên: dấu ấn ngũ hành
        </p>
      </div>
    </section>
  )
}
