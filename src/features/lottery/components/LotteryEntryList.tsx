import { ChevronRight, TicketCheck } from 'lucide-react'
import { formatCurrency, formatDate } from '../../../lib/format'
import {
  LOTTERY_STATUS_LABELS,
  LOTTERY_TYPE_LABELS,
} from '../constants'
import { getPendingUiLabel, LOTTERY_MARKET_LABELS } from '../lottery-schedule'
import { NumberChip } from './NumberChip'
import type { LotteryEntry } from '../types'

type LotteryEntryListProps = {
  entries: LotteryEntry[]
  loading: boolean
  onOpen: (entry: LotteryEntry) => void
}

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  won: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-red-50 text-red-600',
}

export const LotteryEntryList = ({
  entries,
  loading,
  onOpen,
}: LotteryEntryListProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!entries.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-violet-200 bg-white px-6 py-10 text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-violet-50">
          <TicketCheck className="size-6 text-violet-700" />
        </span>
        <p className="font-bold text-slate-800">Chưa có bản ghi</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          Thêm thủ công để theo dõi số tiền và kết quả.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const net = Number(entry.payout) - Number(entry.stake)
        return (
          <article
            key={entry.id}
            onClick={() => onOpen(entry)}
            role="button"
            tabIndex={0}
            className="rounded-[1.5rem] bg-white p-4 shadow-[0_5px_20px_rgba(23,48,40,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-violet-100 px-2 py-1 text-[11px] font-black text-violet-800">
                    {LOTTERY_TYPE_LABELS[entry.play_type]}
                  </span>
                  <span className={`rounded-lg px-2 py-1 text-[11px] font-black ${statusStyles[entry.status]}`}>
                    {entry.status === 'pending' ? getPendingUiLabel(entry.draw_date, entry.draw_time) : LOTTERY_STATUS_LABELS[entry.status]}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-bold text-slate-400">
                  {LOTTERY_MARKET_LABELS[entry.market]}{entry.market === 'south' || entry.market === 'central' || entry.market === 'north' ? ` · ${entry.station}` : ''}
                </p>
                <p className="mt-1 text-[10px] font-bold text-violet-500">Xổ lúc {entry.draw_time}{entry.market === 'hcm_vip' ? ' · ALL' : ''}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.numbers.map((number) => (
                    <NumberChip key={number} number={number} hit={(entry.hit_numbers ?? []).includes(number)} />
                  ))}
                </div>
              </div>
              <ChevronRight className="size-5 text-slate-300" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
              <div>
                <p className="text-slate-400">Tiền vào</p>
                <p className="mt-1 font-black text-slate-700">{formatCurrency(Number(entry.stake))}</p>
              </div>
              <div>
                <p className="text-slate-400">Tiền nhận</p>
                <p className="mt-1 font-black text-slate-700">{formatCurrency(Number(entry.payout))}</p>
              </div>
              <div>
                <p className="text-slate-400">Chênh lệch</p>
                <p className={`mt-1 font-black ${net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {net > 0 ? '+' : ''}
                  {formatCurrency(net)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>{formatDate(entry.draw_date)}</span>
              {entry.note && <span className="max-w-[65%] truncate">{entry.note}</span>}
            </div>
          </article>
        )
      })}
    </div>
  )
}
