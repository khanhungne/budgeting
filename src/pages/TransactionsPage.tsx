import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { formatMonth } from '../lib/dates'
import { CATEGORIES, getCategory } from '../features/transactions/constants'
import { TransactionList } from '../features/transactions/components/TransactionList'
import type { Transaction, TransactionKind } from '../features/transactions/types'
import type { Wallet } from '../features/wallets/types'

type TransactionsPageProps = {
  month: string
  transactions: Transaction[]
  wallets: Wallet[]
  loading: boolean
  onMonthChange: (month: string) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

type KindFilter = 'all' | TransactionKind

export const TransactionsPage = ({
  month,
  transactions,
  wallets,
  loading,
  onMonthChange,
  onEdit,
  onDelete,
}: TransactionsPageProps) => {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [category, setCategory] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setDateFrom('')
    setDateTo('')
  }, [month])

  const monthLimits = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    const lastDay = new Date(year, monthNumber, 0).getDate()
    return {
      min: `${month}-01`,
      max: `${month}-${String(lastDay).padStart(2, '0')}`,
    }
  }, [month])

  const categoryOptions = useMemo(
    () => CATEGORIES.filter((item) => kind === 'all' || item.kind === kind),
    [kind],
  )

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    return transactions.filter((transaction) => {
      const categoryInfo = getCategory(transaction.category)
      const matchesQuery =
        !normalizedQuery ||
        transaction.note?.toLocaleLowerCase('vi').includes(normalizedQuery) ||
        categoryInfo.label.toLocaleLowerCase('vi').includes(normalizedQuery)
      const matchesKind = kind === 'all' || transaction.kind === kind
      const matchesCategory = category === 'all' || transaction.category === category
      const matchesFrom = !dateFrom || transaction.occurred_on >= dateFrom
      const matchesTo = !dateTo || transaction.occurred_on <= dateTo
      return matchesQuery && matchesKind && matchesCategory && matchesFrom && matchesTo
    })
  }, [category, dateFrom, dateTo, kind, query, transactions])

  const hasFilters =
    query.trim() || kind !== 'all' || category !== 'all' || dateFrom || dateTo

  const resetFilters = () => {
    setQuery('')
    setKind('all')
    setCategory('all')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Lịch sử</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Giao dịch</h1>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm capitalize text-slate-500">
            {formatMonth(month)} · {filteredTransactions.length}/{transactions.length} khoản
          </p>
          <input
            type="month"
            value={month}
            onChange={(event) => event.target.value && onMonthChange(event.target.value)}
            aria-label="Chọn tháng"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-emerald-700"
          />
        </div>
      </header>

      <section className="mb-5 rounded-[1.5rem] bg-white p-3 shadow-[0_5px_20px_rgba(23,48,40,0.04)]">
        <div className="flex gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-emerald-800/10">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm ghi chú hoặc danh mục"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Xoá tìm kiếm">
                <X className="size-4 text-slate-400" />
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={`grid size-11 shrink-0 place-items-center rounded-2xl transition ${
              showFilters || kind !== 'all' || category !== 'all' || dateFrom || dateTo
                ? 'bg-emerald-950 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
            aria-label="Bộ lọc"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-400">Loại</span>
              <select
                value={kind}
                onChange={(event) => {
                  setKind(event.target.value as KindFilter)
                  setCategory('all')
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:border-emerald-700"
              >
                <option value="all">Tất cả</option>
                <option value="expense">Khoản chi</option>
                <option value="income">Khoản thu</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-400">Danh mục</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:border-emerald-700"
              >
                <option value="all">Tất cả</option>
                {categoryOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.emoji} {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="col-span-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <label>
                <span className="mb-1.5 block text-[11px] font-bold text-slate-400">
                  Từ ngày
                </span>
                <input
                  type="date"
                  min={monthLimits.min}
                  max={dateTo || monthLimits.max}
                  value={dateFrom}
                  onChange={(event) => {
                    const value = event.target.value
                    setDateFrom(value)
                    if (dateTo && value > dateTo) setDateTo(value)
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-600 outline-none focus:border-emerald-700"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold text-slate-400">
                  Đến ngày
                </span>
                <input
                  type="date"
                  min={dateFrom || monthLimits.min}
                  max={monthLimits.max}
                  value={dateTo}
                  onChange={(event) => {
                    const value = event.target.value
                    setDateTo(value)
                    if (dateFrom && value < dateFrom) setDateFrom(value)
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-600 outline-none focus:border-emerald-700"
                />
              </label>
            </div>
          </div>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 flex items-center gap-1 text-[11px] font-black text-emerald-800"
          >
            <X className="size-3" /> Xoá tất cả bộ lọc
          </button>
        )}
      </section>

      <TransactionList
        transactions={filteredTransactions}
        wallets={wallets}
        loading={loading}
        emptyTitle={hasFilters ? 'Không tìm thấy giao dịch' : undefined}
        emptyDescription={
          hasFilters
            ? 'Thử đổi từ khoá hoặc xoá bớt bộ lọc.'
            : undefined
        }
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}
