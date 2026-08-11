import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Camera, LoaderCircle, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Alert } from '../../../components/ui/Alert'
import { currentDate } from '../../../lib/dates'
import { formatCurrency, formatVndInput, parseVndInput } from '../../../lib/format'
import { getCategory } from '../constants'
import { compressReceiptImage } from '../../../lib/images'
import { CATEGORY_ICONS, suggestionsFor } from '../categorySuggestions'
import type { Category, Transaction, TransactionInput, TransactionKind } from '../types'
import type { Wallet } from '../../wallets/types'
import { WALLET_KIND_EMOJI } from '../../wallets/constants'

type TransactionFormProps = {
  open: boolean
  month: string
  wallets: Wallet[]
  walletBalances: Record<string, number>
  walletBalancesLoading: boolean
  editing: Transaction | null
  saving: boolean
  customCategories: Category[]
  onClose: () => void
  onSave: (input: TransactionInput, editingId?: string) => Promise<void>
  onAddCategory: (kind: TransactionKind, label: string, emoji?: string) => Promise<Category>
}

const initialForm = (month: string, wallets: Wallet[], categories: Category[]): TransactionInput => {
  const today = currentDate()
  return {
    wallet_id: wallets.find((wallet) => !wallet.is_archived)?.id ?? null,
    kind: 'expense',
    amount: 0,
    category: categories.find((item) => item.kind === 'expense')?.id ?? '',
    note: '',
    receipt_image: null,
    occurred_on: today.startsWith(month) ? today : `${month}-01`,
  }
}

export const TransactionForm = ({
  open,
  month,
  wallets,
  walletBalances,
  walletBalancesLoading,
  editing,
  saving,
  customCategories,
  onClose,
  onSave,
  onAddCategory,
}: TransactionFormProps) => {
  const [form, setForm] = useState<TransactionInput>(() => initialForm(month, wallets, customCategories))
  const [amountText, setAmountText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [customEmoji, setCustomEmoji] = useState('📌')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        wallet_id: editing.wallet_id,
        kind: editing.kind,
        amount: Number(editing.amount),
        category: editing.category,
        note: editing.note ?? '',
        receipt_image: editing.receipt_image ?? null,
        occurred_on: editing.occurred_on,
      })
      setAmountText(formatVndInput(Number(editing.amount)))
    } else {
      setForm(initialForm(month, wallets, customCategories))
      setAmountText('')
    }
    setError(null)
    setAddingCategory(false)
    setCustomCategory('')
    setCustomEmoji('📌')
  }, [editing, month, open, wallets])

  const categories = useMemo(() => {
    const base = customCategories.filter((category) => category.kind === form.kind)
    return form.category.startsWith('custom:') && !base.some((item) => item.id === form.category)
      ? [...base, getCategory(form.category)]
      : base
  }, [customCategories, form.category, form.kind])

  if (!open) return null

  const changeKind = (kind: TransactionKind) => {
    const firstCategory = customCategories.find((category) => category.kind === kind)
    setForm((current) => ({
      ...current,
      kind,
      category: firstCategory?.id ?? current.category,
      receipt_image: kind === 'income' ? null : current.receipt_image,
    }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (walletBalancesLoading) {
      setError('Đang tải số dư ví. Hãy thử lại sau giây lát.')
      return
    }
    const amount = parseVndInput(amountText)
    if (!form.wallet_id) {
      setError('Hãy chọn ví nhận hoặc chi tiền.')
      return
    }
    if (!form.category) {
      setError('Hãy tạo hoặc chọn một danh mục trước.')
      return
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError('Số tiền VND không hợp lệ hoặc quá lớn.')
      return
    }
    setError(null)
    try {
      await onSave({ ...form, amount }, editing?.id)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được giao dịch.')
    }
  }

  const addCustomCategory = async () => {
    const label = customCategory.trim()
    if (!label) return
    setSavingCategory(true)
    try {
      const saved = await onAddCategory(form.kind, label, customEmoji)
      setForm((current) => ({ ...current, category: saved.id }))
      setAddingCategory(false)
      setCustomCategory('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không lưu được danh mục.')
    } finally {
      setSavingCategory(false)
    }
  }

  const chooseReceipt = async (file?: File) => {
    if (!file) return
    try {
      const receiptImage = await compressReceiptImage(file)
      setForm((current) => ({ ...current, receipt_image: receiptImage }))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không xử lý được ảnh hóa đơn.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/35 backdrop-blur-[2px] sm:items-center sm:p-5">
      <button className="absolute inset-0" type="button" onClick={onClose} aria-label="Đóng" />
      <section className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-[#fbfcf8] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:rounded-[2rem]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
              Giao dịch
            </p>
            <h2 className="text-2xl font-black text-slate-900">
              {editing ? 'Chỉnh sửa' : 'Thêm khoản mới'}
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

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            {(
              [
                ['expense', 'Khoản chi'],
                ['income', 'Khoản thu'],
              ] as const
            ).map(([kind, label]) => (
              <button
                type="button"
                key={kind}
                onClick={() => changeKind(kind)}
                className={`rounded-xl py-3 text-sm font-extrabold transition ${
                  form.kind === kind
                    ? kind === 'expense'
                      ? 'bg-orange-100 text-orange-800 shadow-sm'
                      : 'bg-emerald-100 text-emerald-800 shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Ví</span>
            <select
              required
              value={form.wallet_id ?? ''}
              onChange={(event) =>
                setForm((current) => ({ ...current, wallet_id: event.target.value || null }))
              }
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-emerald-700"
            >
              <option value="" disabled>
                Chọn ví
              </option>
              {wallets
                .filter((wallet) => !wallet.is_archived || wallet.id === editing?.wallet_id)
                .map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {WALLET_KIND_EMOJI[wallet.kind]} {wallet.name}
                    {wallet.is_archived ? ' (đã lưu trữ)' : ''}
                  </option>
                ))}
            </select>
            {walletBalancesLoading ? (
              <span className="mt-2 block text-xs font-semibold text-slate-400">
                Đang tải số dư ví…
              </span>
            ) : form.wallet_id && walletBalances[form.wallet_id] !== undefined ? (
              <span className="mt-2 block text-xs font-semibold text-slate-500">
                Số dư ví hiện tại:{' '}
                <strong className="text-slate-700">
                  {formatCurrency(walletBalances[form.wallet_id])}
                </strong>
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">Số tiền</span>
            <span className="flex items-baseline rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-900/5">
              <input
                inputMode="numeric"
                required
                value={amountText}
                onChange={(event) => setAmountText(formatVndInput(event.target.value))}
                placeholder="0"
                className="h-16 min-w-0 flex-1 bg-transparent text-3xl font-black tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
              />
              <span className="text-lg font-extrabold text-slate-400">VND</span>
            </span>
          </label>

          <fieldset>
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setAddingCategory((value) => !value)}
                className="flex items-center gap-1 text-xs font-black text-emerald-700"
              >
                <Plus className="size-3.5" /> Danh mục mới
              </button>
            </div>
            {addingCategory && (
              <div className="mb-3 rounded-2xl bg-white p-3">
                <p className="text-[11px] font-bold text-slate-400">Gợi ý</p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {suggestionsFor(form.kind).map((item) => (
                    <button key={item.label} type="button" onClick={() => { setCustomCategory(item.label); setCustomEmoji(item.emoji) }} className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                      {item.emoji} {item.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {CATEGORY_ICONS.map((icon) => <button key={icon} type="button" onClick={() => setCustomEmoji(icon)} className={`grid size-8 place-items-center rounded-lg ${customEmoji === icon ? 'bg-emerald-100 ring-2 ring-emerald-600' : 'bg-slate-50'}`}>{icon}</button>)}
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xl">{customEmoji}</div>
                  <input autoFocus maxLength={18} value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} placeholder="Tên danh mục" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700" />
                  <button type="button" disabled={savingCategory} onClick={() => void addCustomCategory()} className="rounded-xl bg-emerald-800 px-4 text-xs font-black text-white disabled:opacity-50">{savingCategory ? 'Đang lưu' : 'Thêm'}</button>
                </div>
              </div>
            )}
            <legend className="mb-2 text-sm font-bold text-slate-700">Danh mục</legend>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setForm((current) => ({ ...current, category: category.id }))}
                  className={`rounded-2xl border px-1 py-3 text-center transition ${
                    form.category === category.id
                      ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-900/5'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <span className="block text-xl">{category.emoji}</span>
                  <span className="mt-1 block truncate text-[11px] font-bold text-slate-600">
                    {category.label}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Ngày</span>
              <input
                type="date"
                required
                value={form.occurred_on}
                onChange={(event) =>
                  setForm((current) => ({ ...current, occurred_on: event.target.value }))
                }
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-700"
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
                placeholder="Ví dụ: Cơm trưa"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-700"
              />
            </label>
          </div>

          {form.kind === 'expense' && (
            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">Ảnh hóa đơn</span>
              {form.receipt_image ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <img src={form.receipt_image} alt="Ảnh hóa đơn" className="max-h-56 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, receipt_image: null }))}
                    className="absolute right-2 top-2 grid size-9 place-items-center rounded-xl bg-white/90 text-red-600 shadow"
                    aria-label="Xóa ảnh hóa đơn"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 text-sm font-black text-emerald-800">
                  <Camera className="size-5" /> Chụp hoặc chọn ảnh bill
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => void chooseReceipt(event.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          )}

          {error && <Alert>{error}</Alert>}

          <Button type="submit" fullWidth disabled={saving || walletBalancesLoading}>
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            {editing ? 'Lưu thay đổi' : 'Thêm giao dịch'}
          </Button>
        </form>
      </section>
    </div>
  )
}
