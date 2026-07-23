export type TransactionKind = 'expense' | 'income'

export type Transaction = {
  id: string
  user_id: string
  wallet_id: string | null
  kind: TransactionKind
  amount: number
  category: string
  note: string | null
  occurred_on: string
  created_at: string
  updated_at: string
}

export type TransactionInput = {
  wallet_id: string | null
  kind: TransactionKind
  amount: number
  category: string
  note: string
  occurred_on: string
}

export type Category = {
  id: string
  label: string
  emoji: string
  kind: TransactionKind
  color: string
}
