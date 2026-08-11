import { Image, Pencil, ReceiptText, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatCurrency, formatDate } from '../../../lib/format'
import { getCategory } from '../constants'
import type { Category, Transaction } from '../types'
import type { Wallet } from '../../wallets/types'

type TransactionListProps = {
  transactions: Transaction[]
  wallets?: Wallet[]
  loading?: boolean
  limit?: number
  emptyTitle?: string
  emptyDescription?: string
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  onViewReceipt?: (transaction: Transaction) => Promise<string | null>
  categories?: Category[]
}

export const TransactionList = ({
  transactions,
  wallets = [],
  loading = false,
  limit,
  emptyTitle = 'Chưa có giao dịch',
  emptyDescription = 'Chạm nút dấu cộng để ghi khoản đầu tiên.',
  onEdit,
  onDelete,
  onViewReceipt,
  categories = [],
}: TransactionListProps) => {
  const [receipt, setReceipt] = useState<string | null>(null)
  const walletById = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets],
  )

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-[72px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-emerald-50">
          <ReceiptText className="size-6 text-emerald-700" />
        </span>
        <p className="font-bold text-slate-800">{emptyTitle}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">
          {emptyDescription}
        </p>
      </div>
    )
  }

  const visibleTransactions = limit ? transactions.slice(0, limit) : transactions

  return (
    <div className="space-y-2">
      {receipt && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/80 p-5" onClick={() => setReceipt(null)}>
          <button type="button" className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-white text-slate-700" aria-label="Đóng ảnh"><X className="size-5" /></button>
          <img src={receipt} alt="Ảnh hóa đơn" decoding="async" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}
      {visibleTransactions.map((transaction) => {
        const category = getCategory(transaction.category, categories)
        const wallet = transaction.wallet_id
          ? walletById.get(transaction.wallet_id)
          : undefined
        const isIncome = transaction.kind === 'income'

        return (
          <article
            key={transaction.id}
            className="group flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_5px_20px_rgba(23,48,40,0.04)]"
          >
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-xl"
              style={{ backgroundColor: `${category.color}18` }}
            >
              {category.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-slate-800">
                {transaction.note || category.label}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {category.label} · {wallet?.name ?? 'Chưa gán ví'} ·{' '}
                {formatDate(transaction.occurred_on)}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`whitespace-nowrap text-sm font-black ${
                  isIncome ? 'text-emerald-700' : 'text-slate-800'
                }`}
              >
                {isIncome ? '+' : '−'}
                {formatCurrency(Number(transaction.amount))}
              </p>
              <div className="mt-1 flex justify-end gap-2">
                {(transaction.receipt_attached || transaction.receipt_image) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (transaction.receipt_image) {
                        setReceipt(transaction.receipt_image)
                        return
                      }
                      void onViewReceipt?.(transaction).then(setReceipt)
                    }}
                    className="text-sky-500"
                    aria-label="Xem ảnh hóa đơn"
                  >
                    <Image className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onEdit(transaction)}
                  className="text-slate-300 transition hover:text-emerald-700"
                  aria-label="Sửa giao dịch"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(transaction)}
                  className="text-slate-300 transition hover:text-red-500"
                  aria-label="Xoá giao dịch"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
