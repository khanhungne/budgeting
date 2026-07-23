import { useMemo, useState } from 'react'
import { AlertTriangle, Plus, RotateCcw, Scale, SlidersHorizontal, Trophy } from 'lucide-react'
import { LotteryEntryForm } from '../features/lottery/components/LotteryEntryForm'
import { LotteryEntryList } from '../features/lottery/components/LotteryEntryList'
import { LotteryLimitCard } from '../features/lottery/components/LotteryLimitCard'
import {
  LOTTERY_REGION_LABELS,
  LOTTERY_STATIONS,
} from '../features/lottery/constants'
import type { LotteryMonthlyLimit } from '../features/lottery/limitTypes'
import type {
  LotteryEntry,
  LotteryEntryInput,
  LotteryRegion,
} from '../features/lottery/types'
import { formatMonth } from '../lib/dates'
import { formatCurrency } from '../lib/format'

type LotteryPageProps = {
  month: string
  entries: LotteryEntry[]
  loading: boolean
  saving: boolean
  error: string | null
  stats: {
    totalStake: number
    totalPayout: number
    net: number
    pending: number
    winRate: number
  }
  limit: LotteryMonthlyLimit | null
  limitLoading: boolean
  limitSaving: boolean
  limitError: string | null
  onMonthChange: (month: string) => void
  onSave: (input: LotteryEntryInput, editingId?: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onLimitSave: (amount: number) => Promise<void>
}

type RegionFilter = 'all' | LotteryRegion

export const LotteryPage = ({
  month,
  entries,
  loading,
  saving,
  error,
  stats,
  limit,
  limitLoading,
  limitSaving,
  limitError,
  onMonthChange,
  onSave,
  onRemove,
  onLimitSave,
}: LotteryPageProps) => {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LotteryEntry | null>(null)
  const [region, setRegion] = useState<RegionFilter>('all')
  const [station, setStation] = useState('all')

  const stationOptions = useMemo(
    () =>
      region === 'all'
        ? Object.values(LOTTERY_STATIONS).flat()
        : LOTTERY_STATIONS[region],
    [region],
  )

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (region === 'all' || entry.region === region) &&
          (station === 'all' || entry.station === station),
      ),
    [entries, region, station],
  )

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const confirmDelete = async (entry: LotteryEntry) => {
    if (!window.confirm(`Xoá bản ghi ${entry.numbers.join(', ')}?`)) return
    try {
      await onRemove(entry.id)
    } catch {
      // Hook đã hiển thị lỗi ở đầu trang.
    }
  }

  return (
    <>
      <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
            Theo dõi thủ công
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Sổ lô đề</h1>
              <p className="mt-1 text-sm capitalize text-slate-500">{formatMonth(month)}</p>
            </div>
            <input
              type="month"
              value={month}
              onChange={(event) => event.target.value && onMonthChange(event.target.value)}
              aria-label="Chọn tháng"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-violet-600"
            />
          </div>
        </header>

        <div className="mb-5 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Mục này chỉ giúp ghi chép và nhìn rõ lãi/lỗ. Không cung cấp dự đoán, soi cầu hoặc đặt cược.
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-[1.75rem] bg-violet-950 p-5 text-white shadow-[0_18px_40px_rgba(76,29,149,0.18)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-200/70">
                Chênh lệch tháng
              </p>
              <p className={`mt-2 text-2xl font-black ${stats.net >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {stats.net > 0 ? '+' : ''}
                {formatCurrency(stats.net)}
              </p>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
              <Scale className="size-6 text-violet-200" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] text-violet-200/70">Tổng tiền vào</p>
              <p className="mt-1 truncate text-sm font-black">{formatCurrency(stats.totalStake)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] text-violet-200/70">Tổng tiền nhận</p>
              <p className="mt-1 truncate text-sm font-black">{formatCurrency(stats.totalPayout)}</p>
            </div>
          </div>
        </section>

        <LotteryLimitCard
          limit={limit}
          stake={stats.totalStake}
          loading={limitLoading}
          saving={limitSaving}
          onSave={onLimitSave}
        />
        {limitError && (
          <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {limitError}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4">
            <Trophy className="size-5 text-amber-600" />
            <p className="mt-2 text-2xl font-black text-slate-900">{Math.round(stats.winRate)}%</p>
            <p className="text-xs text-slate-400">Tỷ lệ bản ghi đã trúng</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Đang chờ</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{stats.pending}</p>
            <p className="text-xs text-slate-400">Bản ghi chưa có kết quả</p>
          </div>
        </div>

        <section className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-[0_5px_20px_rgba(23,48,40,0.04)]">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-violet-700" />
            <p className="text-xs font-black text-slate-700">Lọc theo miền và đài</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-400">Miền</span>
              <select
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value as RegionFilter)
                  setStation('all')
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:border-violet-600"
              >
                <option value="all">Tất cả miền</option>
                {(Object.entries(LOTTERY_REGION_LABELS) as [LotteryRegion, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-400">Đài</span>
              <select
                value={station}
                onChange={(event) => setStation(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:border-violet-600"
              >
                <option value="all">Tất cả đài</option>
                {stationOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {(region !== 'all' || station !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setRegion('all')
                setStation('all')
              }}
              className="mt-3 flex items-center gap-1 text-[11px] font-black text-violet-700"
            >
              <RotateCcw className="size-3" /> Bỏ bộ lọc
            </button>
          )}
        </section>

        <div className="mb-4 mt-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
              Nhật ký
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-900">
              {filteredEntries.length}/{entries.length} bản ghi
            </h2>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex h-11 items-center gap-2 rounded-2xl bg-violet-800 px-4 text-xs font-black text-white shadow-lg"
          >
            <Plus className="size-4" /> Thêm
          </button>
        </div>

        <LotteryEntryList
          entries={filteredEntries}
          loading={loading}
          onEdit={(entry) => {
            setEditing(entry)
            setFormOpen(true)
          }}
          onDelete={(entry) => void confirmDelete(entry)}
        />
      </div>

      <LotteryEntryForm
        open={formOpen}
        month={month}
        editing={editing}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSave={onSave}
      />
    </>
  )
}
