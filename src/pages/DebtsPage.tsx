import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  HandCoins,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { DebtPeopleOverview, type SelectedDebtPerson } from '../features/debts/components/DebtPeopleOverview'
import { DEBT_AVATARS } from '../features/debts/avatars'
import type { DebtPersonSummary } from '../features/debts/grouping'
import type { Debt, DebtDirection, DebtInput, DebtStatus } from '../features/debts/types'
import { currentDate } from '../lib/dates'
import { formatCurrency, formatDate, formatVndInput, parseVndInput } from '../lib/format'

type Props = {
  debts: Debt[]
  loading: boolean
  saving: boolean
  error: string | null
  totals: { i_owe: number; owed_to_me: number }
  onSave: (input: DebtInput, editingId?: string) => Promise<Debt>
  onStatus: (id: string, status: DebtStatus) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

type Tab = 'pending' | 'paid'
type DirectionFilter = 'all' | DebtDirection

const emptyForm = (): DebtInput => ({
  person: '',
  avatar: DEBT_AVATARS[0],
  amount: 0,
  direction: 'i_owe',
  occurred_on: currentDate(),
  due_on: null,
  note: '',
})

const personKey = (person: string) => person.trim().toLocaleLowerCase('vi')

const overdueDays = (debt: Debt) =>
  debt.status === 'pending' && debt.due_on && debt.due_on < currentDate()
    ? Math.max(
        1,
        Math.floor(
          (new Date(`${currentDate()}T00:00:00`).getTime() -
            new Date(`${debt.due_on}T00:00:00`).getTime()) /
            86_400_000,
        ),
      )
    : 0

export const DebtsPage = ({
  debts,
  loading,
  saving,
  error,
  totals,
  onSave,
  onStatus,
  onRemove,
}: Props) => {
  const [tab, setTab] = useState<Tab>('pending')
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all')
  const [selectedPerson, setSelectedPerson] = useState<SelectedDebtPerson | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Debt | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)

  const visible = useMemo(
    () =>
      debts
        .filter(
          (item) =>
            item.status === tab &&
            (directionFilter === 'all' || item.direction === directionFilter) &&
            (!selectedPerson ||
              (item.direction === selectedPerson.direction &&
                personKey(item.person) === personKey(selectedPerson.person))) &&
            personKey(item.person).includes(personKey(query)),
        )
        .sort((a, b) => {
          if (tab === 'paid') return (b.paid_on ?? '').localeCompare(a.paid_on ?? '')
          if (a.due_on && b.due_on) return a.due_on.localeCompare(b.due_on)
          if (a.due_on) return -1
          if (b.due_on) return 1
          return b.occurred_on.localeCompare(a.occurred_on)
        }),
    [debts, directionFilter, query, selectedPerson, tab],
  )

  const selectPerson = (person: DebtPersonSummary) => {
    const alreadySelected =
      selectedPerson?.direction === person.direction &&
      personKey(selectedPerson.person) === personKey(person.person)
    setSelectedPerson(
      alreadySelected
        ? null
        : { person: person.person, avatar: person.avatar, direction: person.direction },
    )
    setDirectionFilter(alreadySelected ? 'all' : person.direction)
    setTab('pending')
    setQuery('')
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (debt: Debt) => {
    setEditing(debt)
    setSelected(null)
    setFormOpen(true)
  }

  const updateStatus = async (debt: Debt, status: DebtStatus) => {
    if (
      status === 'paid' &&
      !window.confirm(
        `Xác nhận ${formatCurrency(Number(debt.amount))} với ${debt.person} đã được thanh toán?`,
      )
    ) {
      return
    }
    try {
      await onStatus(debt.id, status)
      setSelected(null)
      setTab(status)
      setSelectedPerson(null)
    } catch {
      // Hook hiển thị lỗi ở đầu trang.
    }
  }

  const remove = async (debt: Debt) => {
    if (!window.confirm('Xóa khoản nợ? Khoản nợ này sẽ bị xóa khỏi lịch sử.')) return
    try {
      await onRemove(debt.id)
      setSelected(null)
    } catch {
      // Hook hiển thị lỗi ở đầu trang.
    }
  }

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Theo dõi nghĩa vụ tiền
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Công nợ</h1>
        </div>
        <span className="-rotate-3 rounded-full bg-amber-100 px-3 py-2 text-2xl shadow-sm">🐾</span>
      </header>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-[1.4rem] bg-red-50 p-4">
          <span className="absolute -right-2 -top-2 text-4xl opacity-15">🐻</span>
          <p className="flex items-center gap-1 text-xs font-bold text-red-600">
            <ArrowUpRight className="size-3.5" /> Mình nợ ai
          </p>
          <p className="mt-2 truncate text-lg font-black text-red-700">
            {formatCurrency(totals.i_owe)}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-[1.4rem] bg-emerald-50 p-4">
          <span className="absolute -right-2 -top-2 text-4xl opacity-15">🐰</span>
          <p className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <ArrowDownLeft className="size-3.5" /> Ai nợ mình
          </p>
          <p className="mt-2 truncate text-lg font-black text-emerald-700">
            {formatCurrency(totals.owed_to_me)}
          </p>
        </div>
      </div>

      {tab === 'pending' && (
        <DebtPeopleOverview
          debts={debts}
          selectedPerson={selectedPerson}
          onSelect={selectPerson}
        />
      )}

      <div className="mt-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        {([
          ['pending', 'Đang nợ'],
          ['paid', 'Đã hoàn tất'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value)
              if (value === 'paid') setSelectedPerson(null)
            }}
            className={`rounded-xl py-3 text-xs font-black ${
              tab === value ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="mt-3 rounded-2xl bg-white p-2">
        <p className="flex items-center gap-1 px-2 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          <Layers3 className="size-3" /> Phân loại công nợ
        </p>
        <div className="grid grid-cols-3 gap-1">
          {([
            ['all', 'Tất cả', Layers3],
            ['i_owe', 'Nợ ai', ArrowUpRight],
            ['owed_to_me', 'Ai nợ mình', ArrowDownLeft],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setDirectionFilter(value)
                setSelectedPerson(null)
              }}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-black transition ${
                directionFilter === value
                  ? value === 'i_owe'
                    ? 'bg-red-50 text-red-700'
                    : value === 'owed_to_me'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-800'
                  : 'text-slate-400'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
        {selectedPerson && (
          <button
            type="button"
            onClick={() => {
              setSelectedPerson(null)
              setDirectionFilter('all')
            }}
            className="mx-2 mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800"
          >
            <span>{selectedPerson.avatar}</span> {selectedPerson.person}
            <X className="size-3" />
          </button>
        )}
      </section>

      <label className="mt-3 flex h-11 items-center gap-2 rounded-2xl bg-white px-3">
        <Search className="size-4 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm">
            <X className="size-4 text-slate-400" />
          </button>
        )}
      </label>

      {loading ? (
        <div className="mt-4 h-44 animate-pulse rounded-2xl bg-slate-100" />
      ) : visible.length ? (
        <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white">
          {visible.map((debt, index) => {
            const overdue = overdueDays(debt)
            return (
              <button
                key={debt.id}
                type="button"
                onClick={() => setSelected(debt)}
                className={`flex w-full items-center gap-3 p-4 text-left ${
                  index ? 'border-t border-slate-100' : ''
                }`}
              >
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl ${
                    debt.direction === 'i_owe' ? 'bg-red-50' : 'bg-emerald-50'
                  }`}
                >
                  {debt.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-black text-slate-800">{debt.person}</p>
                    <p className="whitespace-nowrap text-sm font-black text-slate-800">
                      {formatCurrency(Number(debt.amount))}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {debt.direction === 'i_owe' ? 'Mình nợ' : 'Nợ mình'}
                  </p>
                  <p
                    className={`mt-1 text-[11px] font-bold ${
                      overdue ? 'text-red-600' : 'text-slate-400'
                    }`}
                  >
                    {debt.status === 'paid'
                      ? `Đã thanh toán${debt.paid_on ? ` · ${formatDate(debt.paid_on)}` : ''}`
                      : overdue
                        ? `Quá hạn ${overdue} ngày`
                        : debt.due_on
                          ? `Hạn trả: ${formatDate(debt.due_on)}`
                          : 'Không có ngày hạn trả'}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-slate-300" />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-2xl">
            🐣
          </span>
          <p className="mt-3 font-black text-slate-800">
            {query
              ? 'Không tìm thấy khoản nợ'
              : tab === 'pending'
                ? 'Không có khoản nợ nào'
                : 'Chưa có lịch sử hoàn tất'}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-400">
            Các khoản bạn nợ hoặc người khác nợ bạn sẽ xuất hiện ở đây.
          </p>
          {tab === 'pending' && !query && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 rounded-xl bg-emerald-900 px-4 py-3 text-xs font-black text-white"
            >
              + Thêm khoản nợ
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={openCreate}
        className="fixed bottom-24 right-[max(1.25rem,calc((100vw-32rem)/2+1.25rem))] z-40 grid size-14 place-items-center rounded-full bg-emerald-900 text-white shadow-xl"
        aria-label="Thêm khoản nợ"
      >
        <Plus className="size-6" />
      </button>

      {selected && (
        <DebtDetail
          debt={selected}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onStatus={(status) => void updateStatus(selected, status)}
          onRemove={() => void remove(selected)}
        />
      )}
      {formOpen && (
        <DebtForm
          editing={editing}
          saving={saving}
          onClose={() => setFormOpen(false)}
          onSave={async (input) => {
            const saved = await onSave(input, editing?.id)
            setFormOpen(false)
            setSelected(saved)
            setTab(saved.status)
          }}
        />
      )}
    </div>
  )
}

const DebtDetail = ({
  debt,
  onClose,
  onEdit,
  onStatus,
  onRemove,
}: {
  debt: Debt
  onClose: () => void
  onEdit: () => void
  onStatus: (status: DebtStatus) => void
  onRemove: () => void
}) => (
  <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40">
    <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng" />
    <section className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white p-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-slate-100"
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h2 className="text-xl font-black">Chi tiết khoản nợ</h2>
      </header>
      <div className="mt-6 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-[1.8rem] bg-amber-50 text-5xl shadow-sm">
          {debt.avatar}
        </span>
        <p className="mt-3 text-xl font-black text-slate-900">{debt.person}</p>
        <p
          className={`mt-2 text-xs font-black ${
            debt.direction === 'i_owe' ? 'text-red-600' : 'text-emerald-700'
          }`}
        >
          {debt.direction === 'i_owe' ? 'Mình nợ' : 'Nợ mình'}
        </p>
        <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
          {formatCurrency(Number(debt.amount))}
        </p>
      </div>
      <dl className="mt-7 space-y-4 border-y border-slate-100 py-5 text-sm">
        <div>
          <dt className="text-xs text-slate-400">Ngày phát sinh</dt>
          <dd className="mt-1 font-bold text-slate-800">{formatDate(debt.occurred_on)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Ngày hạn trả</dt>
          <dd className="mt-1 font-bold text-slate-800">
            {debt.due_on ? formatDate(debt.due_on) : 'Không có'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Trạng thái</dt>
          <dd
            className={`mt-1 font-bold ${
              debt.status === 'paid'
                ? 'text-emerald-700'
                : overdueDays(debt)
                  ? 'text-red-600'
                  : 'text-amber-600'
            }`}
          >
            {debt.status === 'paid'
              ? `Đã thanh toán${debt.paid_on ? ` ngày ${formatDate(debt.paid_on)}` : ''}`
              : overdueDays(debt)
                ? `Quá hạn ${overdueDays(debt)} ngày`
                : 'Chưa thanh toán'}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Ghi chú</dt>
          <dd className="mt-1 whitespace-pre-wrap font-semibold text-slate-700">
            {debt.note || 'Không có'}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={() => onStatus(debt.status === 'pending' ? 'paid' : 'pending')}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black ${
          debt.status === 'pending' ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <Check className="size-4" />
        {debt.status === 'pending' ? 'Đánh dấu đã thanh toán' : 'Mở lại khoản nợ'}
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-black text-slate-700"
      >
        <Pencil className="size-4" /> Chỉnh sửa
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 text-xs font-black text-red-600"
      >
        <Trash2 className="size-4" /> Xóa khoản nợ
      </button>
    </section>
  </div>
)

const DebtForm = ({
  editing,
  saving,
  onClose,
  onSave,
}: {
  editing: Debt | null
  saving: boolean
  onClose: () => void
  onSave: (input: DebtInput) => Promise<void>
}) => {
  const [form, setForm] = useState<DebtInput>(() =>
    editing
      ? {
          person: editing.person,
          avatar: editing.avatar,
          amount: Number(editing.amount),
          direction: editing.direction,
          occurred_on: editing.occurred_on,
          due_on: editing.due_on,
          note: editing.note ?? '',
        }
      : emptyForm(),
  )
  const [amount, setAmount] = useState(
    editing ? formatVndInput(Number(editing.amount)) : '',
  )
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = parseVndInput(amount)
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      setError('Số tiền không hợp lệ.')
      return
    }
    if (form.due_on && form.due_on < form.occurred_on) {
      setError('Ngày hạn trả không thể trước ngày phát sinh.')
      return
    }
    try {
      setError(null)
      await onSave({ ...form, amount: parsed })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được khoản nợ.')
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng" />
      <section className="relative max-h-[95dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-[#fffdf8] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
              <Sparkles className="size-3" /> Chọn một người bạn nhỏ
            </p>
            <h2 className="mt-1 text-xl font-black">
              {editing ? 'Chỉnh sửa khoản nợ' : 'Thêm khoản nợ'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-slate-100"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </header>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-700">Loại khoản nợ</p>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setForm((value) => ({ ...value, direction: 'i_owe' }))}
                className={`rounded-lg py-3 text-xs font-black ${
                  form.direction === 'i_owe' ? 'bg-white text-red-600 shadow' : 'text-slate-400'
                }`}
              >
                Mình nợ ai
              </button>
              <button
                type="button"
                onClick={() => setForm((value) => ({ ...value, direction: 'owed_to_me' }))}
                className={`rounded-lg py-3 text-xs font-black ${
                  form.direction === 'owed_to_me'
                    ? 'bg-white text-emerald-700 shadow'
                    : 'text-slate-400'
                }`}
              >
                Ai nợ mình
              </button>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-slate-700">Avatar con thú</legend>
            <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50/70 p-3">
              <div className="grid grid-cols-8 gap-1.5">
                {DEBT_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    aria-label={`Chọn avatar ${avatar}`}
                    aria-pressed={form.avatar === avatar}
                    onClick={() => setForm((value) => ({ ...value, avatar }))}
                    className={`grid aspect-square place-items-center rounded-xl text-xl transition ${
                      form.avatar === avatar
                        ? 'bg-white shadow-sm ring-2 ring-amber-500'
                        : 'hover:bg-white/70'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Người liên quan</span>
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 focus-within:border-emerald-700">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-2xl">
                {form.avatar}
              </span>
              <input
                required
                maxLength={60}
                value={form.person}
                onChange={(event) =>
                  setForm((value) => ({ ...value, person: event.target.value }))
                }
                placeholder="Nhập tên người..."
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Số tiền</span>
            <input
              required
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(formatVndInput(event.target.value))}
              placeholder="500.000"
              className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-2xl font-black"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-2 block text-sm font-bold">Ngày phát sinh</span>
              <input
                required
                type="date"
                value={form.occurred_on}
                onChange={(event) =>
                  setForm((value) => ({ ...value, occurred_on: event.target.value }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold">Ngày hạn trả</span>
              <input
                type="date"
                min={form.occurred_on}
                value={form.due_on ?? ''}
                onChange={(event) =>
                  setForm((value) => ({ ...value, due_on: event.target.value || null }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-2 text-xs"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold">Ghi chú</span>
            <textarea
              maxLength={120}
              rows={3}
              value={form.note}
              onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))}
              placeholder="Nhập ghi chú..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 text-sm font-black text-white disabled:opacity-50"
          >
            {saving && <LoaderCircle className="size-4 animate-spin" />} Lưu khoản nợ
          </button>
        </form>
      </section>
    </div>
  )
}
