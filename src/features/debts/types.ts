export type DebtDirection = 'i_owe' | 'owed_to_me'
export type DebtStatus = 'pending' | 'paid'
export type Debt = {
  id: string
  user_id: string
  person: string
  avatar: string
  amount: number
  direction: DebtDirection
  status: DebtStatus
  occurred_on: string
  due_on: string | null
  paid_on: string | null
  note: string | null
  created_at: string
  updated_at: string
}
export type DebtInput = {
  person: string
  avatar: string
  amount: number
  direction: DebtDirection
  occurred_on: string
  due_on: string | null
  note: string
}
