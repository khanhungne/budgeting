export type WalletKind = 'cash' | 'bank' | 'ewallet' | 'other'

export type Wallet = {
  id: string
  user_id: string
  name: string
  kind: WalletKind
  opening_balance: number
  color: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type WalletInput = {
  name: string
  kind: WalletKind
  opening_balance: number
  color: string
}
