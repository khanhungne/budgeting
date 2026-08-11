import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, LoaderCircle, X } from 'lucide-react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { currentDate } from '../../../lib/dates'
import { formatVndInput, parseVndInput } from '../../../lib/format'
import {
  LOTTERY_TYPE_LABELS,
  normalizeLotteryNumbers,
} from '../constants'
import type {
  LotteryEntry,
  LotteryEntryInput,
  LotteryPlayType,
  LotteryMarket,
} from '../types'
import { getLotteryDrawTime, getLotteryStations, LOTTERY_MARKET_LABELS, marketToRegion } from '../lottery-schedule'
import { NumberChip } from './NumberChip'

type LotteryEntryFormProps = {
  open: boolean
  month: string
  editing: LotteryEntry | null
  saving: boolean
  onClose: () => void
  onSave: (input: LotteryEntryInput, editingId?: string) => Promise<void>
}

const initialForm = (month: string): LotteryEntryInput => {
  const today = currentDate()
  const drawDate = today.startsWith(month) ? today : `${month}-01`
  return {
    play_type: 'lo',
    market: 'north',
    region: 'north',
    station: getLotteryStations('north', drawDate)[0],
    numbers: [],
    hit_numbers: [],
    stake: 0,
    payout: 0,
    status: 'pending',
    draw_date: drawDate,
    draw_time: getLotteryDrawTime('north'),
    note: '',
  }
}

export const LotteryEntryForm = ({
  open,
  month,
  editing,
  saving,
  onClose,
  onSave,
}: LotteryEntryFormProps) => {
  const [form, setForm] = useState<LotteryEntryInput>(() => initialForm(month))
  const [numbersText, setNumbersText] = useState('')
  const [stakeText, setStakeText] = useState('')
  const [payoutText, setPayoutText] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        play_type: editing.play_type,
        market: editing.market ?? editing.region,
        region: editing.region,
        station: editing.station,
        numbers: editing.numbers,
        hit_numbers: editing.hit_numbers ?? [],
        stake: Number(editing.stake),
        payout: Number(editing.payout),
        status: editing.status,
        draw_date: editing.draw_date,
        draw_time: editing.draw_time ?? getLotteryDrawTime(editing.market ?? editing.region),
        note: editing.note ?? '',
      })
      setNumbersText(editing.numbers.join(', '))
      setStakeText(formatVndInput(Number(editing.stake)))
      setPayoutText(formatVndInput(Number(editing.payout)))
    } else {
      setForm(initialForm(month))
      setNumbersText('')
      setStakeText('')
      setPayoutText('')
    }
    setError(null)
  }, [editing, month, open])

  if (!open) return null

  const stations = getLotteryStations(form.market, form.draw_date)
  const needsStation = form.market === 'south' || form.market === 'central'

  const changeMarket = (market: LotteryMarket) => {
    const nextStations = getLotteryStations(market, form.draw_date)
    setForm((current) => ({ ...current, market, region: marketToRegion(market), station: nextStations[0], draw_time: getLotteryDrawTime(market) }))
  }

  const changeDrawDate = (draw_date: string) => {
    const nextStations = getLotteryStations(form.market, draw_date)
    setForm((current) => ({ ...current, draw_date, station: current.market === 'south' || current.market === 'central' ? (nextStations.includes(current.station) ? current.station : '') : nextStations[0] }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const numbers = normalizeLotteryNumbers(numbersText)
    const stake = parseVndInput(stakeText)
    const payout = form.status === 'won' ? parseVndInput(payoutText) : 0

    if (!form.station.trim() || form.station.trim().length > 60) {
      setError('Tên đài phải có từ 1–60 ký tự.')
      return
    }
    if (!numbers.length || numbers.length > 10 || numbers.some((number) => !/^\d{2}$/.test(number))) {
      setError('Nhập từ 1–10 số, mỗi số đúng 2 chữ số (ví dụ: 05, 23).')
      return
    }
    if (!Number.isSafeInteger(stake) || stake <= 0) {
      setError('Tổng tiền vào phải là số VND hợp lệ lớn hơn 0.')
      return
    }
    if (form.status === 'won' && (!Number.isSafeInteger(payout) || payout <= 0)) {
      setError('Bản ghi trúng cần có tiền nhận lớn hơn 0 VND.')
      return
    }

    setError(null)
    try {
      const hitNumbers = form.hit_numbers.filter((number) => numbers.includes(number))
      await onSave({ ...form, numbers, hit_numbers: hitNumbers, stake, payout }, editing?.id)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được bản ghi.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-[2px] sm:items-center sm:p-5">
      <button className="absolute inset-0" type="button" onClick={onClose} aria-label="Đóng" />
      <section className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-[#fbfcf8] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:rounded-[2rem]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">
              Sổ theo dõi
            </p>
            <h2 className="text-2xl font-black text-slate-900">
              {editing ? 'Sửa bản ghi' : 'Thêm bản ghi'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-5 flex gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Chỉ ghi chép thủ công để kiểm soát tiền; không dự đoán kết quả hoặc khuyến khích đặt cược.
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-slate-700">Loại</legend>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(LOTTERY_TYPE_LABELS) as [LotteryPlayType, string][]).map(
                ([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setForm((current) => ({ ...current, play_type: value }))}
                    className={`rounded-xl border py-3 text-xs font-black transition ${
                      form.play_type === value
                        ? 'border-violet-600 bg-violet-50 text-violet-800'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-slate-700">Khu vực</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(LOTTERY_MARKET_LABELS) as [LotteryMarket, string][]).map(([value, label]) => (
                <button type="button" key={value} onClick={() => changeMarket(value)} className={`rounded-xl border px-1 py-3 text-xs font-black transition ${form.market === value ? 'border-violet-600 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-500'}`}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Ngày quay</span><input type="date" required value={form.draw_date} onChange={(event) => changeDrawDate(event.target.value)} className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-violet-600" /></label>
            <div><span className="mb-2 block text-sm font-bold text-slate-700">Giờ xổ</span><div className="flex h-14 items-center rounded-2xl bg-violet-50 px-4 text-sm font-black text-violet-800">Xổ lúc {form.draw_time}</div></div>
          </div>

          {needsStation ? (
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Đài theo lịch</span><select required value={form.station} onChange={(event) => setForm((current) => ({ ...current, station: event.target.value }))} className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-violet-600"><option value="" disabled>Chọn đài</option>{stations.map((station) => <option key={station} value={station}>{station}</option>)}</select><span className="mt-1.5 block text-[11px] text-slate-400">Gợi ý đúng theo ngày quay đã chọn.</span></label>
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-[11px] font-bold text-slate-400">Đơn vị kết quả</p><p className="mt-1 text-sm font-black text-slate-700">{stations[0]}</p></div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Các số</span>
            <input
              type="text"
              inputMode="text"
              required
              value={numbersText}
              onChange={(event) => setNumbersText(event.target.value)}
              placeholder="Ví dụ: 05, 23, 68"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5"
            />
            <span className="mt-1.5 block text-[11px] text-slate-400">
              Tối đa 10 số, phân cách bằng dấu phẩy hoặc khoảng trắng.
            </span>
          </label>
          {normalizeLotteryNumbers(numbersText).length > 0 && <div className="flex flex-wrap gap-2">{normalizeLotteryNumbers(numbersText).map((number) => <NumberChip key={number} number={number} />)}</div>}

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Tổng tiền vào</span>
            <span className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-violet-600 focus-within:ring-4 focus-within:ring-violet-600/5">
              <input
                inputMode="numeric"
                required
                value={stakeText}
                onChange={(event) => setStakeText(formatVndInput(event.target.value))}
                placeholder="Ví dụ: 100.000"
                className="h-14 min-w-0 flex-1 bg-transparent text-lg font-black text-slate-900 outline-none"
              />
              <span className="text-xs font-black text-slate-400">VND</span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Ghi chú</span>
              <input
                type="text"
                maxLength={120}
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Tuỳ chọn"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-600"
              />
            </label>
          </div>

          {error && <Alert>{error}</Alert>}
          <Button type="submit" fullWidth disabled={saving} className="bg-violet-800 hover:bg-violet-700">
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            {editing ? 'Lưu thay đổi' : 'Thêm vào sổ'}
          </Button>
        </form>
      </section>
    </div>
  )
}
