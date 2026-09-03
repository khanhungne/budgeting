import { Sparkles } from 'lucide-react'
import { currentDate } from '../../../lib/dates'
import { formatCurrency, formatDate } from '../../../lib/format'
import { summarizePeopleIOwe } from '../grouping'
import type { Debt } from '../types'

type DebtPeopleOverviewProps = {
  debts: Debt[]
  selectedPerson: string | null
  onSelect: (person: string) => void
}

const avatars = ['🐣', '🐼', '🦊', '🐸', '🐰', '🐻', '🐯', '🐧']
const cardStyles = [
  'border-amber-200 bg-amber-50',
  'border-pink-200 bg-pink-50',
  'border-sky-200 bg-sky-50',
  'border-violet-200 bg-violet-50',
  'border-lime-200 bg-lime-50',
]

const personIndex = (person: string, size: number) =>
  [...person].reduce((total, character) => total + character.codePointAt(0)!, 0) % size

export const DebtPeopleOverview = ({
  debts,
  selectedPerson,
  onSelect,
}: DebtPeopleOverviewProps) => {
  const people = summarizePeopleIOwe(debts, currentDate())

  return (
    <section className="mt-5 overflow-hidden rounded-[1.75rem] bg-[#fff8e8] p-4 shadow-[0_8px_30px_rgba(120,80,20,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
            <Sparkles className="size-3.5" /> Gom theo người
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-900">Mình đang nợ ai nhỉ?</h2>
        </div>
        <span className="rotate-3 rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm">
          {people.length} người
        </span>
      </div>

      {people.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-amber-200 bg-white/70 p-4">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="text-sm font-black text-slate-800">Sổ nợ đang sạch!</p>
            <p className="mt-0.5 text-xs text-slate-500">Hiện bạn chưa nợ ai khoản nào.</p>
          </div>
        </div>
      ) : (
        <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {people.map((item, index) => {
            const active = selectedPerson?.toLocaleLowerCase('vi') === item.person.toLocaleLowerCase('vi')
            return (
              <button
                key={item.person.toLocaleLowerCase('vi')}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(item.person)}
                className={`relative w-44 shrink-0 snap-start overflow-hidden rounded-[1.4rem] border p-4 text-left transition ${
                  cardStyles[personIndex(item.person, cardStyles.length)]
                } ${active ? 'ring-2 ring-emerald-700 ring-offset-2' : ''} ${
                  index % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]'
                }`}
              >
                <span className="absolute -right-2 -top-3 text-4xl opacity-20">✦</span>
                <div className="flex items-center gap-2">
                  <span className="grid size-10 place-items-center rounded-full bg-white text-xl shadow-sm">
                    {avatars[personIndex(item.person, avatars.length)]}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-800">
                    {item.person}
                  </p>
                </div>
                <p className="mt-3 truncate text-lg font-black text-slate-900">
                  {formatCurrency(item.total)}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  {item.count} khoản
                  {item.nearestDue ? ` · hạn ${formatDate(item.nearestDue)}` : ''}
                </p>
                {item.overdueCount > 0 && (
                  <span className="mt-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">
                    {item.overdueCount} khoản quá hạn
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
