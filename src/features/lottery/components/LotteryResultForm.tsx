import { LoaderCircle, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { formatVndInput, parseVndInput } from '../../../lib/format'
import type { LotteryEntry, LotteryEntryInput, LotteryStatus } from '../types'
import { NumberChip } from './NumberChip'

export const LotteryResultForm = ({ entry, saving, onClose, onSave }: { entry: LotteryEntry; saving: boolean; onClose: () => void; onSave: (input: LotteryEntryInput, editingId?: string) => Promise<void> }) => {
  const [status, setStatus] = useState<Exclude<LotteryStatus,'pending'>>(entry.status === 'won' ? 'won' : 'lost')
  const [hits, setHits] = useState<string[]>(entry.hit_numbers ?? [])
  const [payout, setPayout] = useState(entry.payout ? formatVndInput(Number(entry.payout)) : '')
  const [error, setError] = useState<string | null>(null)
  const toggle = (number: string) => setHits((items) => items.includes(number) ? items.filter((item) => item !== number) : [...items, number])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const amount = status === 'won' ? parseVndInput(payout) : 0
    if (status === 'won' && !hits.length) return setError('Hãy chọn ít nhất một số đã trúng.')
    if (status === 'won' && (!Number.isSafeInteger(amount) || amount <= 0)) return setError('Tiền nhận phải lớn hơn 0.')
    try {
      await onSave({ play_type: entry.play_type, market: entry.market, region: entry.region, station: entry.station, numbers: entry.numbers, hit_numbers: status === 'won' ? hits : [], stake: Number(entry.stake), payout: amount, status, draw_date: entry.draw_date, draw_time: entry.draw_time, note: entry.note ?? '' }, entry.id)
      onClose()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không cập nhật được kết quả.') }
  }
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40"><section className="w-full max-w-lg rounded-t-[2rem] bg-white p-5"><header className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Kết quả</p><h2 className="text-xl font-black">Cập nhật kết quả</h2></div><button type="button" onClick={onClose}><X /></button></header><form onSubmit={submit} className="mt-5 space-y-5"><div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setStatus('won')} className={`rounded-lg py-3 text-xs font-black ${status==='won'?'bg-white text-emerald-700 shadow':'text-slate-400'}`}>Trúng</button><button type="button" onClick={() => { setStatus('lost'); setHits([]); setPayout('') }} className={`rounded-lg py-3 text-xs font-black ${status==='lost'?'bg-white text-red-600 shadow':'text-slate-400'}`}>Không trúng</button></div><div><p className="mb-2 text-sm font-bold">Số đã vào</p><div className="flex flex-wrap gap-2">{entry.numbers.map((number) => <NumberChip key={number} number={number} hit={hits.includes(number)} selectable={status==='won'} onToggle={() => toggle(number)} />)}</div>{status==='won'&&<p className="mt-2 text-xs text-slate-400">Chạm trực tiếp vào số đã trúng.</p>}</div>{status==='won'&&<label className="block"><span className="mb-2 block text-sm font-bold">Tiền nhận</span><input required inputMode="numeric" value={payout} onChange={(e)=>setPayout(formatVndInput(e.target.value))} placeholder="1.200.000" className="h-14 w-full rounded-xl border border-slate-200 px-4 text-xl font-black" /></label>}{error&&<Alert>{error}</Alert>}<Button type="submit" fullWidth disabled={saving}>{saving&&<LoaderCircle className="size-4 animate-spin" />} Xác nhận kết quả</Button></form></section></div>
}
