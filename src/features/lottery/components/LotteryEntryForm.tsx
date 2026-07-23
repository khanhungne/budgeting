import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, LoaderCircle, X } from 'lucide-react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { currentDate } from '../../../lib/dates'
import { formatVndInput, parseVndInput } from '../../../lib/format'
import {
  LOTTERY_REGION_LABELS,
  LOTTERY_STATIONS,
  LOTTERY_STATUS_LABELS,
  LOTTERY_TYPE_LABELS,
  normalizeLotteryNumbers,
} from '../constants'
import type {
  LotteryEntry,
  LotteryEntryInput,
  LotteryPlayType,
  LotteryRegion,
  LotteryStatus,
} from '../types'

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
  return {
    play_type: 'lo',
    region: 'north',
    station: 'Hà Nội',
    numbers: [],
    stake: 0,
    payout: 0,
    status: 'pending',
    draw_date: today.startsWith(month) ? today : `${month}-01`,
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
        region: editing.region,
        station: editing.station,
        numbers: editing.numbers,
        stake: Number(editing.stake),
        payout: Number(editing.payout),
        status: editing.status,
        draw_date: editing.draw_date,
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

  const changeStatus = (status: LotteryStatus) => {
    setForm((current) => ({ ...current, status, payout: status === 'won' ? current.payout : 0 }))
    if (status !== 'won') setPayoutText('')
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
      await onSave({ ...form, numbers, stake, payout }, editing?.id)
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
            <legend className="mb-2 text-sm font-bold text-slate-700">Miền</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(LOTTERY_REGION_LABELS) as [LotteryRegion, string][]).map(
                ([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        region: value,
                        station: LOTTERY_STATIONS[value][0],
                      }))
                    }
                    className={`rounded-xl border py-3 text-xs font-black transition ${
                      form.region === value
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

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Đài</span>
            <input
              type="text"
              list={`lottery-stations-${form.region}`}
              required
              maxLength={60}
              value={form.station}
              onChange={(event) =>
                setForm((current) => ({ ...current, station: event.target.value }))
              }
              placeholder="Chọn hoặc nhập tên đài"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-violet-600"
            />
            <datalist id={`lottery-stations-${form.region}`}>
              {LOTTERY_STATIONS[form.region].map((station) => (
                <option key={station} value={station} />
              ))}
            </datalist>
          </label>

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

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-slate-700">Kết quả</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(LOTTERY_STATUS_LABELS) as [LotteryStatus, string][]).map(
                ([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => changeStatus(value)}
                    className={`rounded-xl border px-2 py-3 text-xs font-black transition ${
                      form.status === value
                        ? value === 'won'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : value === 'lost'
                            ? 'border-red-400 bg-red-50 text-red-700'
                            : 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          {form.status === 'won' && (
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Tiền nhận</span>
              <span className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-600">
                <input
                  inputMode="numeric"
                  required
                  value={payoutText}
                  onChange={(event) => setPayoutText(formatVndInput(event.target.value))}
                  placeholder="Ví dụ: 7.000.000"
                  className="h-14 min-w-0 flex-1 bg-transparent text-lg font-black text-slate-900 outline-none"
                />
                <span className="text-xs font-black text-slate-400">VND</span>
              </span>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Ngày quay</span>
              <input
                type="date"
                required
                value={form.draw_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, draw_date: event.target.value }))
                }
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-violet-600"
              />
            </label>
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
