import { Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { formatCurrency, formatVndInput, parseVndInput } from '../../../lib/format'
import { getCategory } from '../../transactions/constants'
import type { Category, Transaction } from '../../transactions/types'
import type { CategoryBudget } from '../categoryTypes'

type Props = { budgets: CategoryBudget[]; transactions: Transaction[]; customCategories: Category[]; loading: boolean; saving: boolean; error?: string | null; onSave: (category: string, amount: number) => Promise<void>; onRemove: (id: string) => Promise<void> }

export const CategoryBudgetCard = ({ budgets, transactions, customCategories, loading, saving, error, onSave, onRemove }: Props) => {
  const [adding, setAdding] = useState(false)
  const [category, setCategory] = useState('food')
  const [amount, setAmount] = useState('')
  const options = useMemo(() => {
    const ids = new Set(customCategories.filter((item) => item.kind === 'expense').map((item) => item.id))
    transactions.filter((item) => item.kind === 'expense').forEach((item) => ids.add(item.category))
    return [...ids].map((id) => getCategory(id, customCategories))
  }, [customCategories, transactions])
  const spentByCategory = useMemo(() => {
    const totals = new Map<string, number>()
    transactions.forEach((item) => {
      if (item.kind !== 'expense') return
      totals.set(item.category, (totals.get(item.category) ?? 0) + Number(item.amount))
    })
    return totals
  }, [transactions])
  const used = (id: string) => spentByCategory.get(id) ?? 0
  const edit = (budget: CategoryBudget) => { setCategory(budget.category); setAmount(formatVndInput(Number(budget.amount))); setAdding(true) }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = parseVndInput(amount)
    if (!Number.isSafeInteger(parsed) || parsed <= 0) return
    try {
      await onSave(category, parsed)
      setAmount('')
      setAdding(false)
    } catch {
      // Giữ form mở để người dùng có thể thử lưu lại.
    }
  }
  return (
    <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
      {error && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Target className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-sky-700">Tùy chọn</p><h2 className="font-black text-slate-900">Ngân sách theo danh mục</h2></div></div><button type="button" onClick={() => setAdding((v) => !v)} className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700"><Plus className="size-4" /></button></div>
      {adding && <form onSubmit={submit} className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2"><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 min-w-0 rounded-xl border border-slate-200 px-2 text-xs font-bold">{options.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.label}</option>)}</select><input required inputMode="numeric" value={amount} onChange={(e) => setAmount(formatVndInput(e.target.value))} placeholder="Số tiền" className="h-11 min-w-0 rounded-xl border border-slate-200 px-3 text-xs font-bold" /><button disabled={saving} className="rounded-xl bg-sky-700 px-3 text-xs font-black text-white">Lưu</button></form>}
      {loading ? <div className="mt-4 h-16 animate-pulse rounded-xl bg-slate-100" /> : budgets.length ? <div className="mt-4 space-y-3">{budgets.map((budget) => { const info = getCategory(budget.category, customCategories); const spent = used(budget.category); const remaining = Number(budget.amount) - spent; const ratio = Math.min(100, spent / Number(budget.amount) * 100); return <div key={budget.id}><div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-700">{info.emoji} {info.label}</span><span className="flex items-center gap-2 font-bold text-slate-500">{formatCurrency(spent)} / {formatCurrency(Number(budget.amount))}<button type="button" onClick={() => edit(budget)} className="text-sky-500" aria-label="Sửa ngân sách"><Pencil className="size-3.5" /></button><button type="button" onClick={() => void onRemove(budget.id)} className="text-red-400" aria-label="Xóa ngân sách"><Trash2 className="size-3.5" /></button></span></div><p className={`mt-1 text-[10px] font-bold ${remaining < 0 ? 'text-red-500' : 'text-slate-400'}`}>{remaining >= 0 ? `Còn ${formatCurrency(remaining)}` : `Vượt ${formatCurrency(Math.abs(remaining))}`}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${ratio >= 100 ? 'bg-red-500' : 'bg-sky-500'}`} style={{ width: `${ratio}%` }} /></div></div>})}</div> : <p className="mt-4 text-center text-xs text-slate-400">Chỉ đặt giới hạn cho danh mục bạn cần.</p>}
    </section>
  )
}
