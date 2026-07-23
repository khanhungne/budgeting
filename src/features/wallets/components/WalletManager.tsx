import { useEffect, useState, type FormEvent } from 'react'
import { Archive, ArchiveRestore, LoaderCircle, Pencil, Plus, WalletCards, X } from 'lucide-react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { formatCurrency, formatVndInput, parseVndInput } from '../../../lib/format'
import { WALLET_COLORS, WALLET_KIND_EMOJI, WALLET_KIND_LABELS } from '../constants'
import type { Wallet, WalletInput, WalletKind } from '../types'

type WalletManagerProps = {
  wallets: Wallet[]
  balances: Record<string, number>
  loading: boolean
  saving: boolean
  error: string | null
  onSave: (input: WalletInput, editingId?: string) => Promise<void>
  onToggleArchived: (id: string, archived: boolean) => Promise<void>
}

const defaultInput = (): WalletInput => ({
  name: '',
  kind: 'cash',
  opening_balance: 0,
  color: WALLET_COLORS[0],
})

export const WalletManager = ({
  wallets,
  balances,
  loading,
  saving,
  error,
  onSave,
  onToggleArchived,
}: WalletManagerProps) => {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [form, setForm] = useState<WalletInput>(defaultInput)
  const [balanceText, setBalanceText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!formOpen) return
    if (editing) {
      setForm({
        name: editing.name,
        kind: editing.kind,
        opening_balance: Number(editing.opening_balance),
        color: editing.color,
      })
      setBalanceText(formatVndInput(Number(editing.opening_balance)))
    } else {
      setForm(defaultInput())
      setBalanceText('')
    }
    setFormError(null)
  }, [editing, formOpen])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const openingBalance = parseVndInput(balanceText)
    if (!form.name.trim() || form.name.trim().length > 60) {
      setFormError('Tên ví phải có từ 1–60 ký tự.')
      return
    }
    if (!Number.isSafeInteger(openingBalance) || openingBalance < 0) {
      setFormError('Số dư ban đầu không hợp lệ.')
      return
    }
    setFormError(null)
    try {
      await onSave({ ...form, name: form.name.trim(), opening_balance: openingBalance }, editing?.id)
      setFormOpen(false)
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Không lưu được ví.')
    }
  }

  const activeWallets = wallets.filter((wallet) => !wallet.is_archived)

  return (
    <>
      <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              Nguồn tiền
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-900">Ví và tài khoản</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            className="grid size-10 place-items-center rounded-2xl bg-emerald-950 text-white"
            aria-label="Thêm ví"
          >
            <Plus className="size-5" />
          </button>
        </div>

        {error && <div className="mt-4"><Alert>{error}</Alert></div>}

        {loading ? (
          <div className="mt-4 space-y-2">
            {[1, 2].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {wallets.map((wallet) => (
              <article
                key={wallet.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  wallet.is_archived ? 'border-slate-100 bg-slate-50 opacity-65' : 'border-slate-100'
                }`}
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-2xl text-lg"
                  style={{ backgroundColor: `${wallet.color}18` }}
                >
                  {WALLET_KIND_EMOJI[wallet.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-800">{wallet.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {WALLET_KIND_LABELS[wallet.kind]}
                    {wallet.is_archived ? ' · Đã lưu trữ' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-700">
                    {formatCurrency(balances[wallet.id] ?? Number(wallet.opening_balance))}
                  </p>
                  <div className="mt-1 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(wallet)
                        setFormOpen(true)
                      }}
                      className="text-slate-300 hover:text-emerald-700"
                      aria-label={`Sửa ví ${wallet.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={!wallet.is_archived && activeWallets.length <= 1}
                      onClick={() => void onToggleArchived(wallet.id, !wallet.is_archived)}
                      className="text-slate-300 hover:text-amber-700 disabled:opacity-30"
                      aria-label={wallet.is_archived ? 'Khôi phục ví' : 'Lưu trữ ví'}
                    >
                      {wallet.is_archived ? (
                        <ArchiveRestore className="size-3.5" />
                      ) : (
                        <Archive className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-emerald-950/35 backdrop-blur-[2px] sm:items-center sm:p-5">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setFormOpen(false)}
            aria-label="Đóng"
          />
          <section className="relative w-full max-w-md rounded-t-[2rem] bg-[#fbfcf8] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[2rem]">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-emerald-100">
                  <WalletCards className="size-5 text-emerald-800" />
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {editing ? 'Sửa ví' : 'Thêm ví'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="grid size-9 place-items-center rounded-full bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Tên ví</span>
                <input
                  required
                  maxLength={60}
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Ví dụ: Vietcombank"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-700"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Loại ví</span>
                <select
                  value={form.kind}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      kind: event.target.value as WalletKind,
                    }))
                  }
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-emerald-700"
                >
                  {(Object.entries(WALLET_KIND_LABELS) as [WalletKind, string][]).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {WALLET_KIND_EMOJI[value]} {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Số dư ban đầu
                </span>
                <span className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-700">
                  <input
                    inputMode="numeric"
                    value={balanceText}
                    onChange={(event) => setBalanceText(formatVndInput(event.target.value))}
                    placeholder="0"
                    className="h-14 min-w-0 flex-1 bg-transparent font-black outline-none"
                  />
                  <span className="text-xs font-black text-slate-400">VND</span>
                </span>
              </label>

              <fieldset>
                <legend className="mb-2 text-sm font-bold text-slate-700">Màu nhận diện</legend>
                <div className="flex gap-3">
                  {WALLET_COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setForm((current) => ({ ...current, color }))}
                      className={`size-9 rounded-full border-4 ${
                        form.color === color ? 'border-slate-900' : 'border-white'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Chọn màu ${color}`}
                    />
                  ))}
                </div>
              </fieldset>

              {formError && <Alert>{formError}</Alert>}
              <Button type="submit" fullWidth disabled={saving}>
                {saving && <LoaderCircle className="size-4 animate-spin" />}
                {editing ? 'Lưu thay đổi' : 'Tạo ví'}
              </Button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
