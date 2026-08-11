import { LoaderCircle, Pencil, Plus, Tags, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { CategoryInput, StoredCategory } from '../api/categories'
import { CATEGORY_ICONS, suggestionsFor } from '../categorySuggestions'

type Props = {
  categories: StoredCategory[]
  loading: boolean
  saving: boolean
  error: string | null
  onSave: (input: CategoryInput, editingId?: string) => Promise<StoredCategory>
  onRemove: (id: string) => Promise<void>
}
const empty: CategoryInput = { label: '', emoji: '📌', kind: 'expense', color: '#d97706' }

export const CategoryManager = ({ categories, loading, saving, error, onSave, onRemove }: Props) => {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>()
  const [form, setForm] = useState<CategoryInput>(empty)
  const showCreate = () => { setEditingId(undefined); setForm(empty); setOpen(true) }
  const showEdit = (item: StoredCategory) => { setEditingId(item.id); setForm({ label: item.label, emoji: item.emoji, kind: item.kind, color: item.color }); setOpen(true) }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await onSave(form, editingId)
      setOpen(false)
    } catch {
      // Hook hiển thị lỗi và giữ form mở để người dùng thử lại.
    }
  }

  return <section className="mt-5 rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(23,48,40,0.05)]">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-orange-50 text-orange-700"><Tags className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-orange-700">Dữ liệu dùng chung</p><h2 className="font-black text-slate-900">Quản lý danh mục</h2></div></div><button type="button" onClick={showCreate} className="flex h-9 items-center gap-1 rounded-xl bg-orange-50 px-3 text-xs font-black text-orange-700"><Plus className="size-4" /> Thêm</button></div>
    <p className="mt-3 text-xs leading-5 text-slate-400">Giao dịch và ngân sách cùng sử dụng các danh mục trong danh sách này.</p>
    {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>}
    {loading ? <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100" /> : <div className="mt-4 grid grid-cols-2 gap-2">{categories.map((item) => <article key={item.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 p-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl text-lg" style={{ backgroundColor: `${item.color}18` }}>{item.emoji}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-700">{item.label}</p><p className="text-[10px] text-slate-400">{item.kind === 'expense' ? 'Khoản chi' : 'Khoản thu'}</p></div><div className="flex flex-col gap-1"><button type="button" onClick={() => showEdit(item)} className="text-slate-400" aria-label={`Sửa ${item.label}`}><Pencil className="size-3.5" /></button><button type="button" onClick={() => window.confirm(`Xóa danh mục “${item.label}”?`) && void onRemove(item.id)} className="text-red-400" aria-label={`Xóa ${item.label}`}><Trash2 className="size-3.5" /></button></div></article>)}</div>}
    {open && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40"><section className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white p-5"><div className="flex items-center justify-between"><h3 className="text-xl font-black">{editingId ? 'Sửa danh mục' : 'Thêm danh mục'}</h3><button type="button" onClick={() => setOpen(false)}><X /></button></div><form onSubmit={submit} className="mt-5 space-y-4"><div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" disabled={Boolean(editingId)} onClick={() => setForm((v) => ({ ...v, kind: 'expense' }))} className={`rounded-lg py-2.5 text-xs font-black ${form.kind === 'expense' ? 'bg-white text-orange-700 shadow' : 'text-slate-400'}`}>Khoản chi</button><button type="button" disabled={Boolean(editingId)} onClick={() => setForm((v) => ({ ...v, kind: 'income' }))} className={`rounded-lg py-2.5 text-xs font-black ${form.kind === 'income' ? 'bg-white text-emerald-700 shadow' : 'text-slate-400'}`}>Khoản thu</button></div>{!editingId && <div><p className="mb-2 text-xs font-bold text-slate-500">Gợi ý danh mục</p><div className="flex gap-2 overflow-x-auto pb-1">{suggestionsFor(form.kind).map((item) => <button key={item.label} type="button" onClick={() => setForm({ ...item })} className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"><span>{item.emoji}</span>{item.label}</button>)}</div></div>}<div><p className="mb-2 text-xs font-bold text-slate-500">Chọn icon</p><div className="grid grid-cols-9 gap-1">{CATEGORY_ICONS.map((icon) => <button key={icon} type="button" onClick={() => setForm((v) => ({ ...v, emoji: icon }))} className={`grid aspect-square place-items-center rounded-lg text-lg ${form.emoji === icon ? 'bg-emerald-100 ring-2 ring-emerald-600' : 'bg-slate-50'}`}>{icon}</button>)}</div></div><input required maxLength={18} value={form.label} onChange={(e) => setForm((v) => ({ ...v, label: e.target.value }))} placeholder="Tên danh mục" className="h-12 w-full rounded-xl border border-slate-200 px-4" /><label className="flex h-12 items-center justify-between rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500">Màu danh mục <input type="color" value={form.color} onChange={(e) => setForm((v) => ({ ...v, color: e.target.value }))} className="size-8" /></label><button disabled={saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 text-sm font-black text-white disabled:opacity-50">{saving && <LoaderCircle className="size-4 animate-spin" />} Lưu danh mục</button></form></section></div>}
  </section>
}
